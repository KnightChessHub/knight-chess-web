import { useEffect, useState, useRef } from 'react';
import { apiService } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ChatMessage } from '../types';
import { useAuthStore } from '../store/authStore';

export default function Chat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await apiService.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedUser) {
        const firstConversation = data[0];
        const otherUserId =
          firstConversation.senderId === user?._id
            ? firstConversation.receiverId
            : firstConversation.senderId;
        setSelectedUser(otherUserId);
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const data = await apiService.getConversation(userId, 50);
      setMessages(data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) return;

    try {
      await apiService.sendMessage(selectedUser, message);
      setMessage('');
      loadMessages(selectedUser);
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const getConversationUser = (conversation: ChatMessage) => {
    return conversation.senderId === user?._id
      ? conversation.receiverId
      : conversation.senderId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] animate-fade-in">
      {/* Conversations List */}
      <Card className="overflow-hidden flex flex-col animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold mb-5 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary flex-shrink-0" />
          <span>Conversations</span>
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No conversations</p>
          ) : (
            conversations.map((conv) => {
              const otherUserId = getConversationUser(conv);
              const isSelected = selectedUser === otherUserId;
              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedUser(otherUserId)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-light border border-primary'
                      : 'bg-bg-tertiary hover:bg-bg-hover'
                  }`}
                >
                  <p className="font-semibold">{conv.senderUsername || 'User'}</p>
                  <p className="text-text-secondary text-sm truncate">{conv.message || 'No message'}</p>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2 flex flex-col animate-scale-in" style={{ animationDelay: '0.2s' }}>
        {selectedUser ? (
          <>
            <div className="mb-5 pb-5 border-b border-border">
              <h3 className="text-xl font-bold">Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-5">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-text-secondary">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?._id;
                  return (
                    <div
                      key={msg._id || Math.random()}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-xl shadow-lg ${
                          isMine
                            ? 'bg-primary text-white'
                            : 'bg-bg-tertiary text-text-primary'
                        }`}
                      >
                        <p className="font-medium">{msg.message || 'Empty message'}</p>
                        <p className={`text-xs mt-2 ${isMine ? 'opacity-80' : 'opacity-60'}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Now'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!message.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

