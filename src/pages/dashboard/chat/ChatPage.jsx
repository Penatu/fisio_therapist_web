import { useLocation, Link } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useGetChatRooms from '@/pages/dashboard/hooks/useGetChatRooms';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const location = useLocation();
  const { rooms, yourChatRef, loading, error, reload } = useGetChatRooms();
  const roomAlert = location.state?.roomAlert || '';

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Chat dengan Pasien</h1>
            <p className="text-muted-foreground">
              Chat tersedia untuk orderan yang sedang berjalan
            </p>
          </div>

          {roomAlert && (
            <Card className="mb-4 border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {roomAlert}
            </Card>
          )}

          {loading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Memuat chat...</p>
            </Card>
          ) : error ? (
            <Card className="p-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button type="button" variant="outline" onClick={reload}>
                Muat ulang
              </Button>
            </Card>
          ) : rooms.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Tidak ada chat aktif</p>
              <p className="text-sm text-muted-foreground">
                Chat akan muncul ketika orderan sedang berjalan
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/dashboard/chat/room/${encodeURIComponent(room.id)}`}
                  state={{ room, yourChatRef: room.yourChatRef || yourChatRef }}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="p-6 hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                    <div className="flex gap-4 items-start">
                      {room.patientImage ? (
                        <img
                          src={room.patientImage}
                          alt={room.patientName}
                          className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {room.patientInitial}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-foreground truncate">{room.patientName}</h3>
                          {room.time && (
                            <span className="shrink-0 text-xs text-muted-foreground">{room.time}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{room.lastMessage}</p>
                      </div>

                      {room.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-white">
                            {room.unreadCount > 9 ? '9+' : room.unreadCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
