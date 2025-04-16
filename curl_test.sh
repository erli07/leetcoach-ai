#!/bin/bash

SESSION_ID="session123"
URL="http://127.0.0.1:8000/interview"

echo "1️⃣ Requesting a LeetCode-style question..."
curl -s -X POST $URL -H "Content-Type: application/json" -d '{"user_message": "#leetcode medium array", "session_id": "'$SESSION_ID'"}'
echo -e "\n"

echo "2️⃣ Asking a follow-up question..."
curl -s -X POST $URL -H "Content-Type: application/json" -d '{"user_message": "What’s the time complexity of that?", "session_id": "'$SESSION_ID'"}'
echo -e "\n"

echo "3️⃣ Getting an AI-generated hint..."
curl -s -X POST $URL -H "Content-Type: application/json" -d '{"user_message": "#hint", "session_id": "'$SESSION_ID'"}'
echo -e "\n"

echo "4️⃣ Asking for concept explanation..."
curl -s -X POST $URL -H "Content-Type: application/json" -d '{"user_message": "Can you explain how prefix products work?", "session_id": "'$SESSION_ID'"}'
echo -e "\n"

echo "5️⃣ Getting structured feedback..."
curl -s -X POST $URL -H "Content-Type: application/json" -d '{"user_message": "#feedback", "session_id": "'$SESSION_ID'"}'
echo -e "\n"
