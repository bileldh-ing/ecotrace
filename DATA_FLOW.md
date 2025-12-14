# Data Flow Architecture

## Overview

This is a chat application with user authentication and per-user data isolation. Each user has their own unique profile, contacts list, and chat history.

---

## Services Used

| Service | Purpose | Data Path |
|---------|---------|-----------|
| **Firebase Auth** | User authentication | Email/password credentials |
| **Firebase Realtime DB** | Core data storage | `users/`, `contacts/`, `all_discussion/` |
| **Supabase Storage** | Media file storage | `chat-assets/` bucket |

---

## Firebase Realtime Database Structure

### `users/{uid}` - User Profiles
Each authenticated user has a unique profile node identified by their Firebase Auth UID.

```json
{
  "id": "user_uid_123",
  "username": "john_doe",
  "email": "john@email.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "status": "online|offline",
  "image": "https://supabase-url/profile-images/profile_uid_timestamp.jpg",
  "createdAt": 1702060000000,
  "lastSeen": 1702060000000
}
```

### `contacts/{uid}/{contactId}` - Per-User Contacts
Each user has their own private contacts list. **Contacts are NOT shared between users.**

```json
{
  "contacts": {
    "user_uid_123": {
      "-contact_key_1": {
        "id": "-contact_key_1",
        "name": "Alice Smith",
        "email": "alice@email.com",
        "phone": "+1987654321",
        "city": "New York",
        "status": "offline",
        "createdAt": 1702060000000
      },
      "-contact_key_2": { ... }
    },
    "user_uid_456": {
      // Different contacts for different user
    }
  }
}
```

### `all_discussion/{chatId}/Messages` - Chat Messages
Chats are stored uniquely per pair of users. ChatId = sorted concatenation of user UIDs.

```json
{
  "all_discussion": {
    "uid123uid456": {
      "Messages": {
        "-message_key_1": {
          "sender": "user_uid_123",
          "receiver": "user_uid_456",
          "messagebody": "Hello!",
          "imageUrl": "https://...",
          "time": 1702060000000
        }
      },
      "typing": {
        "user_uid_123": false,
        "user_uid_456": true
      }
    }
  }
}
```

---

## Supabase Storage Structure

### Bucket: `chat-assets/`

```
chat-assets/
├── profile-images/
│   └── profile_{uid}_{timestamp}.jpg    (unique per user)
└── chat-images/
    └── {timestamp}_{random}.jpg         (chat attachments)
```

---

## Key Data Isolation Points

| Data Type | Isolation Level | Path |
|-----------|-----------------|------|
| User Profile | Per-user | `users/{uid}` |
| Contacts | Per-user | `contacts/{uid}/*` |
| Chat Messages | Per-pair | `all_discussion/{chatId}/*` |
| Profile Image | Per-user | `profile_{uid}_*.jpg` |

---

## Data Flow Diagrams

### Sign Up
```
createUserWithEmailAndPassword(email, password)
    ↓
Firebase Auth creates user with UID
    ↓
set(users/{uid}, { username, email, status, createdAt })
    ↓
Navigate to home
```

### Add Contact (Per-User)
```
User enters contact info in Profile screen
    ↓
push(contacts/{currentUser.uid}, { name, email, phone })
    ↓
Only this user sees this contact in their Contacts list
```

### Send Message
```
push(all_discussion/{chatId}/Messages, {
  sender: currentUser.uid,
  receiver: otherUser.id,
  messagebody: text,
  time: timestamp
})
    ↓
Real-time listener updates both users' chat UI
```
