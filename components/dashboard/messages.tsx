"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Search, ImageIcon, Paperclip, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore"
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { format } from "date-fns"

type UserType = "patient" | "doctor" | "pharmacy" | "admin"

interface MessagesContentProps {
  userType: UserType
}

interface Contact {
  id: string
  name: string
  role: string
  photoUrl?: string
  lastMessage?: string
  lastMessageTime?: any
  unread?: number
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: any
  imageUrl?: string
  fileUrl?: string
  fileName?: string
}

export function MessagesContent({ userType }: MessagesContentProps) {
  const { user, userData } = useAuth()
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch contacts
  useEffect(() => {
    if (!user || !isClient) return

    const fetchContacts = async () => {
      try {
        setLoading(true)

        // Query depends on user type
        let contactsQuery

        if (userType === "patient") {
          // Patients can message doctors and pharmacies
          contactsQuery = query(collection(db, "users"), where("userType", "in", ["doctor", "pharmacy"]))
        } else if (userType === "doctor") {
          // Doctors can message patients and pharmacies
          contactsQuery = query(collection(db, "users"), where("userType", "in", ["patient", "pharmacy"]))
        } else if (userType === "pharmacy") {
          // Pharmacies can message patients and doctors
          contactsQuery = query(collection(db, "users"), where("userType", "in", ["patient", "doctor"]))
        } else {
          // Admins can message everyone
          contactsQuery = query(collection(db, "users"), where("userType", "in", ["patient", "doctor", "pharmacy"]))
        }

        const contactsSnapshot = await getDocs(contactsQuery)
        const contactsList: Contact[] = []

        for (const docSnapshot of contactsSnapshot.docs) {
          const contactData = docSnapshot.data()

          // Skip if it's the current user
          if (docSnapshot.id === user.uid) continue

          // Get the last message between users
          const chatId = [user.uid, docSnapshot.id].sort().join("_")
          const messagesQuery = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "desc"),
            limit(1),
          )

          const messagesSnapshot = await getDocs(messagesQuery)
          let lastMessage = ""
          let lastMessageTime = null
          let unread = 0

          if (!messagesSnapshot.empty) {
            const messageData = messagesSnapshot.docs[0].data()
            lastMessage = messageData.text
            lastMessageTime = messageData.timestamp

            // Count unread messages - Split into two separate queries to avoid index requirement
            // First, get all messages in this chat
            const allMessagesQuery = query(
              collection(db, "chats", chatId, "messages"),
              where("senderId", "!=", user.uid),
            )

            const allMessagesSnapshot = await getDocs(allMessagesQuery)

            // Then filter locally for unread messages
            unread = allMessagesSnapshot.docs.filter((doc) => doc.data().read === false).length
          }

          contactsList.push({
            id: docSnapshot.id,
            name: contactData.fullName || contactData.pharmacyName || "User",
            role: contactData.userType,
            photoUrl: contactData.photoUrl,
            lastMessage,
            lastMessageTime,
            unread,
          })
        }

        // Sort contacts by last message time
        contactsList.sort((a, b) => {
          if (!a.lastMessageTime) return 1
          if (!b.lastMessageTime) return -1
          return b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis()
        })

        setContacts(contactsList)

        // Select the first contact if none is selected
        if (contactsList.length > 0 && !selectedContact) {
          setSelectedContact(contactsList[0].id)
        }
      } catch (error) {
        console.error("Error fetching contacts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [user, userType, selectedContact, isClient])

  // Fetch messages for selected contact
  useEffect(() => {
    if (!user || !selectedContact || !isClient) return

    const chatId = [user.uid, selectedContact].sort().join("_")

    const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList: Message[] = []

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        messagesList.push({
          id: docSnapshot.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp,
          imageUrl: data.imageUrl,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        })
      })

      setMessages(messagesList)

      // Mark messages as read
      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        if (data.senderId !== user.uid && !data.read) {
          try {
            // Create a proper document reference
            const messageRef = doc(db, "chats", chatId, "messages", docSnapshot.id)
            // Use updateDoc instead of doc.ref.update
            updateDoc(messageRef, { read: true }).catch((err) => {
              console.error("Error updating message read status:", err)
            })
          } catch (error) {
            console.error("Error marking message as read:", error)
          }
        }
      })
    })

    return () => unsubscribe()
  }, [user, selectedContact, isClient])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Filter contacts based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Helper function to upload a file with progress tracking and better error handling
  const uploadFileWithRetry = async (file: File, path: string, maxRetries = 3): Promise<string> => {
    let retries = 0

    while (retries < maxRetries) {
      try {
        // Create storage reference
        const fileRef = ref(storage, path)

        // Use uploadBytesResumable for better control and progress tracking
        const uploadTask = uploadBytesResumable(fileRef, file)

        // Return a promise that resolves with the download URL or rejects with an error
        return new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // You could track and display upload progress here if needed
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              console.log(`Upload progress: ${progress.toFixed(2)}%`)
            },
            (error) => {
              console.error(`Upload error (attempt ${retries + 1}/${maxRetries}):`, error)
              reject(error)
            },
            async () => {
              // Upload completed successfully, get download URL
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve(downloadURL)
              } catch (error) {
                console.error("Error getting download URL:", error)
                reject(error)
              }
            },
          )
        })
      } catch (error) {
        console.error(`Upload attempt ${retries + 1} failed:`, error)
        retries++

        if (retries >= maxRetries) {
          throw new Error(`Failed to upload file after ${maxRetries} attempts`)
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
      }
    }

    throw new Error("Upload failed after maximum retries")
  }

  const sendMessage = async () => {
    if (!user || !selectedContact || (!messageText.trim() && !selectedFile && !selectedImage)) return

    setSending(true)
    setUploadError(null)

    try {
      const chatId = [user.uid, selectedContact].sort().join("_")

      let imageUrl = ""
      let fileUrl = ""
      let fileName = ""

      // Upload image if selected
      if (selectedImage) {
        try {
          const path = `chats/${chatId}/images/${Date.now()}_${selectedImage.name}`
          imageUrl = await uploadFileWithRetry(selectedImage, path)
          console.log("Image uploaded successfully:", imageUrl)
        } catch (error) {
          console.error("Image upload failed:", error)
          setUploadError("Failed to upload image. Please try again.")
          return
        }
      }

      // Upload file if selected
      if (selectedFile) {
        try {
          const path = `chats/${chatId}/files/${Date.now()}_${selectedFile.name}`
          fileUrl = await uploadFileWithRetry(selectedFile, path)
          fileName = selectedFile.name
          console.log("File uploaded successfully:", fileUrl)
        } catch (error) {
          console.error("File upload failed:", error)
          setUploadError("Failed to upload file. Please try again.")
          return
        }
      }

      // Add message to Firestore
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: messageText.trim(),
        timestamp: serverTimestamp(),
        read: false,
        imageUrl,
        fileUrl,
        fileName,
      })

      // Clear input
      setMessageText("")
      setSelectedFile(null)
      setSelectedImage(null)
    } catch (error) {
      console.error("Error sending message:", error)
      setUploadError("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size exceeds 5MB limit. Please select a smaller file.")
        return
      }

      // Check if it's an image
      if (file.type.startsWith("image/")) {
        setSelectedImage(file)
      } else {
        setSelectedFile(file)
      }

      // Clear any previous errors
      setUploadError(null)
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setSelectedImage(null)
    setUploadError(null)
  }

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return ""

    const date = timestamp.toDate()
    const now = new Date()

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a")
    }

    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, "MMM d")
    }

    // Otherwise show full date
    return format(date, "MMM d, yyyy")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const getSelectedContact = () => {
    return contacts.find((contact) => contact.id === selectedContact)
  }

  // Don't render anything on the server
  if (!isClient) {
    return <div className="h-[calc(100vh-12rem)] flex flex-col">Loading...</div>
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>

      <div className="flex flex-1 overflow-hidden border rounded-lg">
        {/* Contacts List */}
        <div className="w-1/3 border-r overflow-hidden flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading contacts...</p>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedContact === contact.id ? "bg-gray-100" : ""}`}
                  onClick={() => setSelectedContact(contact.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={contact.photoUrl || ""} alt={contact.name} />
                      <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate">{contact.name}</p>
                        <span className="text-xs text-gray-500">
                          {contact.lastMessageTime ? formatMessageTime(contact.lastMessageTime) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{contact.role}</p>
                      <p className="text-sm truncate">{contact.lastMessage || "No messages yet"}</p>
                    </div>
                    {contact.unread && contact.unread > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {contact.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No contacts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={getSelectedContact()?.photoUrl || ""} alt={getSelectedContact()?.name || ""} />
                    <AvatarFallback>
                      {getSelectedContact()?.name ? getInitials(getSelectedContact()?.name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getSelectedContact()?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{getSelectedContact()?.role}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          message.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-gray-100"
                        } rounded-lg p-3`}
                      >
                        {message.imageUrl && (
                          <div className="mb-2">
                            <img
                              src={message.imageUrl || "/placeholder.svg"}
                              alt="Shared image"
                              className="rounded-md max-w-full max-h-60 object-contain"
                            />
                          </div>
                        )}

                        {message.fileUrl && (
                          <div className="mb-2">
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-white rounded-md text-blue-600 hover:text-blue-800"
                            >
                              <Paperclip className="h-4 w-4" />
                              <span className="text-sm truncate">{message.fileName}</span>
                            </a>
                          </div>
                        )}

                        {message.text && <p>{message.text}</p>}

                        <p
                          className={`text-xs mt-1 ${
                            message.senderId === user?.uid ? "text-primary-foreground/70" : "text-gray-500"
                          }`}
                        >
                          {message.timestamp ? formatMessageTime(message.timestamp) : "Sending..."}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              {/* File Preview */}
              {(selectedFile || selectedImage) && (
                <div className="px-4 py-2 border-t">
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      {selectedImage ? (
                        <div className="relative w-12 h-12">
                          <img
                            src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
                            alt="Selected"
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        </div>
                      ) : (
                        <Paperclip className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="text-sm truncate">
                        {selectedImage ? selectedImage.name : selectedFile?.name}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearSelectedFile} className="h-8 w-8 rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={sending}
                  >
                    <Paperclip className="h-5 w-5" />
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={sending}
                  >
                    <ImageIcon className="h-5 w-5" />
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>

                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
                    disabled={sending}
                  />

                  <Button size="icon" onClick={sendMessage} disabled={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
