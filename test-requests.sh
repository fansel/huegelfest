#!/bin/bash

# Test 1: Device 1 mit thumbsUp
curl -X PUT https://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "id": "68114f6dc5539742020b280b",
    "reactions": {
      "thumbsUp": {
        "count": 1,
        "deviceReactions": {
          "device1": {
            "type": "thumbsUp",
            "announcementId": "68114f6dc5539742020b280b"
          }
        }
      }
    }
  }'

# Test 2: Device 2 mit heart
curl -X PUT https://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "id": "68114f6dc5539742020b280b",
    "reactions": {
      "heart": {
        "count": 1,
        "deviceReactions": {
          "device2": {
            "type": "heart",
            "announcementId": "68114f6dc5539742020b280b"
          }
        }
      }
    }
  }'

# Test 3: Device 3 mit laugh
curl -X PUT https://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "id": "68114f6dc5539742020b280b",
    "reactions": {
      "laugh": {
        "count": 1,
        "deviceReactions": {
          "device3": {
            "type": "laugh",
            "announcementId": "68114f6dc5539742020b280b"
          }
        }
      }
    }
  }' 