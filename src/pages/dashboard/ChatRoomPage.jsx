import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useGetChatRooms from '@/pages/dashboard/hooks/useGetChatRooms';
import { useChatSocket } from '@/pages/dashboard/hooks/useChatSocket';
import { ArrowLeft, Send } from 'lucide-react';

export default function ChatRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: roomId = '' } = useParams();
  const preview = location.state?.room?.id === roomId ? location.state.room : null;
  const { rooms, yourChatRef: fetchedYourChatRef, loading, error, reload } = useGetChatRooms();
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef(null);

  const room = rooms.find((item) => item.id === roomId) || preview;
  const yourChatRef =
    room?.yourChatRef ||
    fetchedYourChatRef ||
    preview?.yourChatRef ||
    location.state?.yourChatRef ||
    '';

  const handleRoomError = useCallback(
    (message) => {
      navigate('/dashboard/chat', {
        replace: true,
        state: { roomAlert: message || 'Room tidak valid' },
      });
    },
    [navigate],
  );

  const {
    messages,
    isConnected,
    partnerOnline,
    historyLoading,
    historyError,
    connectionError,
    sendMessage,
    reloadHistory,
  } = useChatSocket({
    roomId: yourChatRef ? roomId : '',
    userRef: yourChatRef,
    onRoomError: handleRoomError,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, historyLoading]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!messageInput.trim()) return;

    const sent = sendMessage(messageInput);
    if (!sent) {
      setSendError('Koneksi chat terputus. Coba kirim lagi.');
      return;
    }

    setSendError('');
    setMessageInput('');
  };

  const presenceLabel = partnerOnline ? 'Online' : isConnected ? 'Offline' : 'Menghubungkan...';
  const patientName = room?.patientName || 'Pasien';
  const showRoom = Boolean(roomId && (room || yourChatRef || loading));

  return (
    <ProtectedRoute>
      <main className="bg-gradient-to-br from-background to-secondary/20">
        <div className="mx-auto flex h-[calc(100dvh-4.5rem)] max-w-4xl flex-col px-4 py-4">
          <button
            onClick={() => navigate('/dashboard/chat')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          {!showRoom && error ? (
            <Card className="p-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button type="button" variant="outline" onClick={reload}>
                Muat ulang
              </Button>
            </Card>
          ) : !showRoom ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Chat tidak ditemukan</p>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/chat')}>
                Kembali ke daftar
              </Button>
            </Card>
          ) : (
            <>
              <Card className="mb-4 gap-0 p-4 py-4">
                <div className="flex items-center gap-4">
                  {room?.patientImage ? (
                    <img
                      src={room.patientImage}
                      alt={patientName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {room?.patientInitial || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-foreground">{patientName}</h2>
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          partnerOnline ? 'bg-accent' : isConnected ? 'bg-muted-foreground/40' : 'bg-amber-500'
                        }`}
                      />
                      {presenceLabel}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="mb-4 min-h-0 flex-1 gap-0 overflow-y-auto p-4 py-4">
                {loading && !room && !yourChatRef ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Memuat chat...
                  </div>
                ) : !yourChatRef && error ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button type="button" variant="outline" className="mt-4" onClick={reload}>
                      Muat ulang
                    </Button>
                  </div>
                ) : !yourChatRef ? (
                  <div className="flex h-full items-center justify-center text-sm text-destructive">
                    Referensi chat tidak ditemukan
                  </div>
                ) : (
                  <div className="space-y-4">
                    {connectionError && (
                      <p className="rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                        {connectionError}
                      </p>
                    )}
                    {historyLoading ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">Memuat pesan...</p>
                    ) : historyError ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-destructive">{historyError}</p>
                        <Button type="button" variant="outline" className="mt-4" onClick={reloadHistory}>
                          Muat ulang
                        </Button>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-muted-foreground mb-2">Belum ada pesan</p>
                        <p className="text-xs text-muted-foreground">Mulai percakapan dengan pasien</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs rounded-lg px-4 py-2 sm:max-w-md ${
                              message.isSelf
                                ? 'rounded-br-none bg-primary text-primary-foreground'
                                : 'rounded-bl-none bg-secondary text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            {message.time && <p className="mt-1 text-xs opacity-75">{message.time}</p>}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </Card>

              <form onSubmit={handleSendMessage} className="shrink-0">
                {sendError && <p className="mb-2 text-xs text-destructive">{sendError}</p>}
                <div className="flex gap-3">
                  <Input
                    placeholder="Ketik pesan..."
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    disabled={!yourChatRef || !isConnected}
                    className="h-11 flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!yourChatRef || !isConnected || !messageInput.trim()}
                    className="h-11 px-4"
                    size="lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
