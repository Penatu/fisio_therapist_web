import { useChat } from '@/lib/chat-context';
import { useBooking } from '@/lib/booking-context';
import { useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ChatRoomPage() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();

  const { getChatRoom, getMessages, addMessage } = useChat();
  const { getBookingById } = useBooking();

  const chatRoom = getChatRoom(`chat-${bookingId}`);
  const booking = getBookingById(bookingId);
  const messages = chatRoom ? getMessages(`chat-${bookingId}`) : [];

  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chatRoom || !booking) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>

            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Chat tidak ditemukan</p>
            </Card>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    try {
      setLoading(true);
      addMessage(`chat-${bookingId}`, {
        senderId: 'therapist',
        senderName: 'Anda',
        message: messageInput,
        timestamp: new Date().toISOString(),
        type: 'text',
      });
      setMessageInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-4xl px-4 h-screen max-h-screen flex flex-col">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <Card className="p-6 mb-6">
            <div className="flex gap-4 items-center">
              <img
                src={chatRoom.patientImage || '/placeholder.png'}
                alt={chatRoom.patientName}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {chatRoom.patientName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {booking?.service} • {booking?.location}
                </p>
              </div>
            </div>
          </Card>

          <Card className="flex-1 p-6 overflow-y-auto mb-6 flex flex-col">
            <div className="space-y-4 flex-1">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === 'therapist' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-4 py-2 ${
                        msg.senderId === 'therapist'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-secondary text-foreground rounded-bl-none'
                      }`}
                    >
                      {msg.type === 'text' && <p className="text-sm">{msg.message}</p>}
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <p className="text-muted-foreground mb-2">Belum ada pesan</p>
                    <p className="text-xs text-muted-foreground">
                      Mulai percakapan dengan pasien
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              placeholder="Ketik pesan..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={loading || !messageInput.trim()}
              className="px-4"
              size="lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
