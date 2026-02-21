import { useChat } from '@/lib/chat-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { MessageSquare, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChatPage() {
  const { chatRooms } = useChat();

  const processingChats = chatRooms.filter((room) => room.status === 'processing');

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Chat dengan Pasien</h1>
            <p className="text-muted-foreground">
              Chat hanya tersedia untuk orderan yang sedang diproses
            </p>
          </div>

          <div className="space-y-4">
            {processingChats.length > 0 ? (
              processingChats.map((room) => (
                <Link key={room.id} to={`/dashboard/chat/room/${room.bookingId}`}>
                  <Card className="p-6 hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                    <div className="flex gap-4 items-start">
                      <img
                        src={room.patientImage || '/placeholder.png'}
                        alt={room.patientName}
                        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 justify-between mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {room.patientName}
                          </h3>
                          <StatusBadge status="processing" />
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {room.lastMessage}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {room.lastMessageTime}
                        </div>
                      </div>

                      {room.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                            {room.unreadCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">Tidak ada chat aktif</p>
                <p className="text-sm text-muted-foreground">
                  Chat akan muncul ketika Anda menerima orderan yang sedang diproses
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
