import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Trash2,
  LogIn,
  UserPlus,
  SendHorizonal,
  LogOut,
  Plus,
  X,
  Users,
  Search,
  MoreVertical,
  Edit,
  Check,
  CheckCheck,
  Crown,
  UserMinus,
  UserCheck,
} from "lucide-react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  IconButton,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  Paper,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Chip,
  ListItemButton,
} from "@mui/material";

import Grid from "@mui/material/GridLegacy";
import { format } from "date-fns";

const API_URL = "https://blog-node-km1z.onrender.com";
interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface Post {
  _id: string;
  title: string;
  content: string;
  author: { name: string; email: string; role: string };
  likes: string[];
}

interface Chat {
  _id: string;
  name?: string;
  isChatMode: boolean;
  members: { user: User | string; role: "admin" | "member" }[];
  messages: Omit<Message[], "createdAt">;
}

interface Message {
  _id: string;
  sender: User | string;
  text: string;
  status: "sent" | "read";
  createdAt: string;
  readBy: string[];
}

interface Toast {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
}

export default function BlogPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>({
    open: false,
    message: "",
    severity: "info",
  });

  // Чаты
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [chatName, setChatName] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuMessage, setMenuMessage] = useState<Message | null>(null);
  const [chatMenuAnchor, setChatMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [editingChatName, setEditingChatName] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [openMembersDialog, setOpenMembersDialog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin";
// Глобальная утилита: сколько времени прошло с даты
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now.getTime() - past.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "только что";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${pluralize(
      diffInMinutes,
      "мин",
      "минуту",
      "минуты",
      "минут"
    )} назад`;
  }

  if (diffInHours < 24) {
    return `${diffInHours} ${pluralize(
      diffInHours,
      "ч",
      "час",
      "часа",
      "часов"
    )} назад`;
  }

  if (diffInDays === 1) {
    return "вчера";
  }

  if (diffInDays < 7) {
    return `${diffInDays} ${pluralize(
      diffInDays,
      "дн",
      "день",
      "дня",
      "дней"
    )} назад`;
  }

  return format(past, "dd.MM.yyyy");
}

// Вспомогательная функция для склонения
function pluralize(
  count: number,
  suffix: string,
  one: string,
  few: string,
  many: string
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one + (suffix ? "" : "");
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few + (suffix ? "" : "");
  }
  return many + (suffix ? "" : "");
}
  const showToast = (
    message: string,
    severity: "success" | "error" | "info" = "info"
  ) => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => setToast((prev) => ({ ...prev, open: false }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // === Загрузка данных ===
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUser(await res.json());
      else localStorage.removeItem("token");
    } catch {
      showToast("Ошибка загрузки профиля", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setPosts(await res.json());
    } catch {
      showToast("Ошибка загрузки постов", "error");
    }
  }, []);

  const loadChats = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    try {
      const res = await fetch(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: Chat[] = await res.json();

      // ДЕБАГ 1: Что пришло?
      console.log(
        "Raw chats from server:",
        data.map((c) => ({
          id: c._id,
          messagesCount: c.messages.length,
          lastCreatedAt: c.messages[c.messages.length - 1]?.createdAt,
        }))
      );

      // ДЕБАГ 2: Проверим, что даты парсятся
      data.forEach((chat) => {
        const last = chat.messages[chat.messages.length - 1];
        if (last?.createdAt) {
          const time = new Date(last.createdAt).getTime();
          console.log(
            `Chat ${chat._id} → ${last.createdAt} → ${time} (${
              isNaN(time) ? "INVALID" : "OK"
            })`
          );
        }
      });

      // Сортировка с защитой
      const sortedChats = [...data].sort((a, b) => {
        const timeA =
          a.messages.length > 0
            ? new Date(a.messages[a.messages.length - 1].createdAt).getTime()
            : -Infinity;

        const timeB =
          b.messages.length > 0
            ? new Date(b.messages[b.messages.length - 1].createdAt).getTime()
            : -Infinity;

        const diff = timeB - timeA;
        // ДЕБАГ 3: Покажем, как сравниваются
        if (a._id === data[0]._id || b._id === data[0]._id) {
          console.log(`Compare: A=${timeA}, B=${timeB}, diff=${diff}`);
        }
        return diff;
      });

      // ДЕБАГ 4: Что стало после сортировки?
      console.log(
        "Sorted chats:",
        sortedChats.map((c) => ({
          id: c._id,
          lastTime: new Date(
            c.messages[c.messages.length - 1]?.createdAt || 0
          ).toISOString(),
        }))
      );

      setChats(sortedChats);
    } catch (err) {
      console.error("Load chats error:", err);
      showToast("Ошибка загрузки чатов", "error");
    }
  }, [user]);

  const loadUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      showToast("Ошибка загрузки пользователей", "error");
    }
  }, []);

  const loadMessages = useCallback(
    async (chatId: string) => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Message[] = await res.json();

          setMessages(data);

          const unread = data.filter(
            (m) => m.status === "sent" && m.sender !== user?._id
          );
          for (const msg of unread) {
            await fetch(`${API_URL}/chats/${chatId}/messages/${msg._id}/read`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      } catch {
        showToast("Ошибка загрузки сообщений", "error");
      }
    },
    [user]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUser();
      loadPosts();
    } else {
      loadPosts();
    }
  }, [loadUser, loadPosts]);

  useEffect(() => {
    if (user) {
      loadChats();
      loadUsers();
      const interval = setInterval(() => {
        loadChats();
        if (selectedChat) loadMessages(selectedChat._id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [user, selectedChat, loadChats, loadMessages, loadUsers]);

  useEffect(() => {
    if (selectedChat) loadMessages(selectedChat._id);
  }, [selectedChat, loadMessages]);

  // === Авторизация ===
  async function handleAuth(type: "login" | "register") {
    if (!auth.email || !auth.password || (type === "register" && !auth.name)) {
      return showToast("Заполните все поля!", "error");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auth),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setAuth({ name: "", email: "", password: "" });
        await loadUser();
        showToast(
          type === "login" ? "Добро пожаловать!" : "Регистрация успешна!",
          "success"
        );
      } else {
        showToast(data.message || "Ошибка", "error");
      }
    } catch {
      showToast("Сервер недоступен", "error");
    } finally {
      setLoading(false);
    }
  }

  // === Посты ===
  async function handleCreate() {
    if (!title.trim() || !content.trim())
      return showToast("Заполните поля", "error");
    const token = localStorage.getItem("token");
    const tempId = `temp-${Date.now()}`;
    const newPost: Post = {
      _id: tempId,
      title,
      content,
      author: user!,
      likes: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setTitle("");
    setContent("");
    try {
      const res = await fetch(`${API_URL}/post/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const created = await res.json();
        setPosts((prev) => prev.map((p) => (p._id === tempId ? created : p)));
        showToast("Пост опубликован!", "success");
      }
    } catch {
      setPosts((prev) => prev.filter((p) => p._id !== tempId));
      showToast("Ошибка создания поста", "error");
    }
  }

  async function handleLike(id: string) {
    const token = localStorage.getItem("token");
    if (!user) return showToast("Войдите", "error");
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== id) return p;
        const liked = p.likes.includes(user._id);
        return {
          ...p,
          likes: liked
            ? p.likes.filter((uid) => uid !== user._id)
            : [...p.likes, user._id],
        };
      })
    );
    try {
      await fetch(`${API_URL}/post/${id}/like`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      showToast("Ошибка лайка", "error");
      loadPosts();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить пост?")) return;
    const token = localStorage.getItem("token");
    setPosts((prev) => prev.filter((p) => p._id !== id));
    try {
      await fetch(`${API_URL}/post/${id}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Пост удалён", "success");
    } catch {
      showToast("Ошибка удаления", "error");
      loadPosts();
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    setChats([]);
    setSelectedChat(null);
    showToast("Вы вышли", "info");
  }

  // === Чаты ===
  const createChat = async () => {
    if (selectedUsers.length === 0)
      return showToast("Выберите пользователя", "error");
    const token = localStorage.getItem("token");
    const isGroup = !!(selectedUsers.length > 1 || chatName.trim());

    try {
      const res = await fetch(`${API_URL}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          users: selectedUsers,
          isChatMode: isGroup,
          name: chatName,
          message: isGroup ? `${chatName} создан!` : "Чат начат!",
        }),
      });
      if (res.ok) {
        const chat = await res.json();
        setChats((prev) => [chat, ...prev]);
        setSelectedChat(chat);
        setOpenChatDialog(false);
        setSelectedUsers([]);
        setChatName("");
        showToast("Чат создан!", "success");
      }
    } catch {
      showToast("Ошибка создания чата", "error");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const token = localStorage.getItem("token");
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      _id: user?._id as string,
      sender: user?._id as string,
      text: newMessage,
      status: "sent",
      readBy: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");
    scrollToBottom();

    try {
      const res = await fetch(`${API_URL}/chats/${selectedChat._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => prev.map((m) => (m._id === tempId ? msg : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      showToast("Не отправлено", "error");
    }
  };

  const editMessage = async (msgId: string) => {
    if (!editText.trim() || !selectedChat) return;
    const token = localStorage.getItem("token");
    const oldMsg = messages.find((m) => m._id === msgId);
    if (!oldMsg) return;

    setMessages((prev) =>
      prev.map((m) => (m._id === msgId ? { ...m, text: editText } : m))
    );
    setEditingMessage(null);
    setEditText("");

    try {
      await fetch(
        `${API_URL}/chats/${selectedChat._id}/messages/${msgId}/change`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: editText }),
        }
      );
    } catch {
      setMessages((prev) => prev.map((m) => (m._id === msgId ? oldMsg : m)));
      showToast("Ошибка редактирования", "error");
    }
  };

  const deleteMessage = async (msgId: string) => {
    const token = localStorage.getItem("token");
    if (!selectedChat) return;
    setMessages((prev) => prev.filter((m) => m._id !== msgId));
    try {
      await fetch(`${API_URL}/chats/${selectedChat._id}/messages/${msgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      loadMessages(selectedChat._id);
      showToast("Ошибка удаления", "error");
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm("Удалить чат?")) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/chats/${chatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (selectedChat?._id === chatId) setSelectedChat(null);
      showToast("Чат удалён", "success");
    } catch {
      showToast("Ошибка удаления чата", "error");
    }
  };

  const editChatName = async () => {
    if (!newChatName.trim() || !selectedChat) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/chats/${selectedChat._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newChatName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setChats((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        setSelectedChat(updated);
        setNewChatName("");
        setEditingChatName(false);
        showToast("Название обновлено", "success");
      }
    } catch {
      showToast("Ошибка изменения названия", "error");
    }
  };

  const addMember = async (memberId: string) => {
    const token = localStorage.getItem("token");
    if (!selectedChat) return;
    try {
      const res = await fetch(
        `${API_URL}/chats/${selectedChat._id}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setChats((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        setSelectedChat(updated);
        showToast("Участник добавлен", "success");
      }
    } catch {
      showToast("Ошибка добавления", "error");
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Удалить участника?")) return;
    const token = localStorage.getItem("token");
    if (!selectedChat) return;
    try {
      await fetch(`${API_URL}/chats/${selectedChat._id}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadChats();
      loadMessages(selectedChat._id);
      showToast("Участник удалён", "success");
    } catch {
      showToast("Ошибка удаления", "error");
    }
  };

  const changeRole = async (memberId: string, role: "admin" | "member") => {
    const token = localStorage.getItem("token");
    if (!selectedChat) return;
    try {
      await fetch(
        `${API_URL}/chats/${selectedChat._id}/members/${memberId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        }
      );
      loadChats();
      showToast("Роль изменена", "success");
    } catch {
      showToast("Ошибка изменения роли", "error");
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    const other = users
      .filter((m) => chat?.members?.some?.((u) => m._id === u.user))
      .filter((m) => m._id !== user?._id)
      .map((el) => el.name);
    return other?.join(",") || "Чат";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isChatMode && chat.name) return <Users size={16} />;
    const other = users.find((m) =>
      chat?.members?.some?.((u) => m._id === u.user)
    );

    return other?.name?.[0]?.toUpperCase() || "?";
  };

  const formatTime = (date: string) => format(new Date(date), "HH:mm");

  const openMessageMenu = (e: React.MouseEvent<HTMLElement>, msg: Message) => {
    setMenuAnchor(e.currentTarget);
    setMenuMessage(msg);
  };

  const openChatMenu = (e: React.MouseEvent<HTMLElement>) => {
    setChatMenuAnchor(e.currentTarget);
  };

  const closeMenus = () => {
    setMenuAnchor(null);
    setMenuMessage(null);
    setChatMenuAnchor(null);
  };

  const isChatAdmin =
    selectedChat?.members?.find?.((m) => m.user === user?._id)?.role ===
    "admin";

  useEffect(() => {
    if (selectedChat && messages.length) {
      scrollToBottom();
    }
  }, [selectedChat, messages.length]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "white",
          boxShadow: 1,
          p: 2,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            DreamNet
          </Typography>
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#6a11cb" }}>{user.name[0]}</Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontWeight={600}>{user.name}</Typography>
                <Typography variant="caption" color="primary">
                  {user.role === "admin" ? "Админ" : "Пользователь"}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLogout}
                startIcon={<LogOut size={16} />}
              >
                Выйти
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {loading && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.9)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Авторизация */}
        {!user && (
          <Grid container justifyContent="center">
            <Grid item xs={12} sm={8} md={6} lg={4}>
              <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <CardHeader
                  title="Вход / Регистрация"
                  sx={{ textAlign: "center", color: "#6a11cb" }}
                />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Имя"
                    value={auth.name}
                    onChange={(e) => setAuth({ ...auth, name: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={auth.email}
                    onChange={(e) =>
                      setAuth({ ...auth, email: e.target.value })
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Пароль"
                    type="password"
                    value={auth.password}
                    onChange={(e) =>
                      setAuth({ ...auth, password: e.target.value })
                    }
                    sx={{ mb: 3 }}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleAuth("register")}
                        startIcon={<UserPlus />}
                      >
                        Регистрация
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleAuth("login")}
                        startIcon={<LogIn />}
                      >
                        Вход
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {user && (
          <Grid container spacing={3}>
            {/* Чаты */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  height: "calc(100vh - 180px)",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  overflow: "hidden",
                  boxShadow: 3,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#6a11cb",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography fontWeight={600}>Чаты</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setOpenChatDialog(true)}
                    sx={{ color: "white" }}
                  >
                    <Plus />
                  </IconButton>
                </Box>
                <List sx={{ flex: 1, overflow: "auto" }}>
                  {chats.map((chat) => {
                    const lastMessage = chat.messages[chat.messages.length - 1];
                    const unreadMessagesLength = chat.messages.filter(
                      (c) =>
                        !c.readBy?.includes?.(user._id) && c.sender !== user._id
                    ).length;

                    return (
                      <ListItemButton
                        key={chat._id}
                        selected={selectedChat?._id === chat._id}
                        onClick={() => setSelectedChat(chat)}
                        sx={{
                          borderLeft:
                            selectedChat?._id === chat._id
                              ? "4px solid #6a11cb"
                              : "4px solid transparent",
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: chat.isChatMode ? "#e3f2fd" : "#fff3e0",
                            }}
                          >
                            {getChatAvatar(chat)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getChatName(chat)}
                          secondary={
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "5px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span>
                                  {lastMessage.sender === user._id
                                    ? "Вы"
                                    : users.find(
                                        (u) => u._id === lastMessage.sender
                                      )?.name}
                                  :
                                </span>
                                <span>{lastMessage?.text}</span>
                              </div>
                              <span style={{ fontSize: "12px" }}>
                                {formatTimeAgo(lastMessage.createdAt)}
                              </span>
                            </div>
                          }
                          slotProps={{
                            primary: {
                              style: {
                                fontWeight: "600",
                                overflow: "hidden",
                                textWrap: "nowrap",
                                textOverflow: "ellipsis",
                                whiteSpace: "none",
                              },
                            },
                          }}
                        />
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {unreadMessagesLength ? (
                            <>
                              <Avatar
                                sx={{
                                  bgcolor: "#ff1744",
                                  color: "white",
                                  width: 24,
                                  height: 24,
                                  fontSize: 12,
                                }}
                              >
                                {unreadMessagesLength}
                              </Avatar>
                            </>
                          ) : lastMessage.sender === user._id ? (
                            lastMessage.status === "sent" ? (
                              <Check color="green" size={14} />
                            ) : (
                              <CheckCheck color="green" size={14} />
                            )
                          ) : null}
                        </Box>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Paper>
            </Grid>

            {/* Посты или Чат */}
            <Grid item xs={12} md={8}>
              {!selectedChat ? (
                // Посты
                <>
                  <Card sx={{ mb: 3, p: 3, borderRadius: 3, boxShadow: 3 }}>
                    <TextField
                      fullWidth
                      label="Заголовок"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Текст"
                      multiline
                      minRows={3}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleCreate}
                      startIcon={<SendHorizonal />}
                    >
                      Опубликовать
                    </Button>
                  </Card>
                  {posts.map((p) => {
                    const isPostAdmin = p.author.role === "admin";
                    return (
                      <motion.div
                        key={p._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card
                          sx={{
                            mb: 3,
                            bgcolor: isPostAdmin ? "#fffbe6" : "#fff",
                            border: isPostAdmin
                              ? "1px solid #ff6b6b"
                              : "1px solid #e0e0e0",
                            borderRadius: 3,
                            overflow: "hidden",
                            boxShadow: isPostAdmin
                              ? "0 0 15px rgba(255, 107, 107, 0.3)"
                              : "0 2px 12px rgba(0,0,0,0.06)",
                            position: "relative",
                          }}
                        >
                          {isPostAdmin && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                bgcolor: "#ff6b6b",
                                color: "white",
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            >
                              ADMIN
                            </Box>
                          )}
                          <CardHeader
                            avatar={
                              isPostAdmin ? (
                                <Avatar sx={{ bgcolor: "transparent", p: 0.5 }}>
                                  <img
                                    src="/snoopy-esnupi.gif"
                                    alt="Admin"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "contain",
                                    }}
                                  />
                                </Avatar>
                              ) : (
                                <Avatar
                                  sx={{
                                    bgcolor: "#e3f2fd",
                                    color: "#1976d2",
                                    fontWeight: 600,
                                  }}
                                >
                                  {p.author.name[0].toUpperCase()}
                                </Avatar>
                              )
                            }
                            title={p.author.name}
                            subheader={
                              <Typography
                                variant="caption"
                                color={
                                  isPostAdmin ? "#d32f2f" : "text.secondary"
                                }
                              >
                                {isPostAdmin ? "Админ" : "Пользователь"}
                              </Typography>
                            }
                          />
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {p.title}
                            </Typography>
                            <Typography>{p.content}</Typography>
                          </CardContent>
                          <CardActions>
                            <IconButton
                              sx={{ outline: 0 }}
                              onClick={() => handleLike(p._id)}
                            >
                              <Heart
                                style={{
                                  stroke: p.likes.includes(user._id)
                                    ? "#ff1744"
                                    : "currentcolor",
                                }}
                                fill={
                                  p.likes.includes(user._id)
                                    ? "#ff1744"
                                    : "none"
                                }
                              />
                              <Typography sx={{ ml: 0.5 }}>
                                {p.likes.length}
                              </Typography>
                            </IconButton>
                            {(p.author.email === user.email || isAdmin) && (
                              <IconButton
                                onClick={() => handleDelete(p._id)}
                                color="error"
                              >
                                <Trash2 />
                              </IconButton>
                            )}
                          </CardActions>
                        </Card>
                      </motion.div>
                    );
                  })}
                </>
              ) : (
                // Чат
                <Paper
                  sx={{
                    height: "calc(100vh - 180px)",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: 3,
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#6a11cb",
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedChat(null)}
                        sx={{ color: "white" }}
                      >
                        <X />
                      </IconButton>
                      {editingChatName ? (
                        <TextField
                          size="small"
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && editChatName()}
                          sx={{
                            overflow: "hidden",
                            textWrap: "nowrap",
                            textOverflow: "ellipsis",
                            whiteSpace: "none",
                            bgcolor: "white",
                          }}
                          slotProps={{
                            input: {
                              style: {
                                color: "black",
                                borderRadius: "0px",
                                border: "none",
                              },
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            overflow: "hidden",
                            textWrap: "nowrap",
                            textOverflow: "ellipsis",
                            whiteSpace: "none",
                            maxWidth: "200px",
                          }}
                          fontWeight={600}
                        >
                          {getChatName(selectedChat)}
                        </Typography>
                      )}
                      {
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingChatName(true);
                            setNewChatName(selectedChat.name || "");
                          }}
                          sx={{ color: "white" }}
                        >
                          <Edit size={16} />
                        </IconButton>
                      }
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {selectedChat.isChatMode && (
                        <Tooltip title="Управление участниками">
                          <IconButton
                            size="small"
                            onClick={() => setOpenMembersDialog(true)}
                            sx={{ color: "white" }}
                          >
                            <Users />
                          </IconButton>
                        </Tooltip>
                      )}
                      {selectedChat.isChatMode && (
                        <IconButton
                          size="small"
                          onClick={openChatMenu}
                          sx={{ color: "white" }}
                        >
                          <MoreVertical />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                    {messages.map((msg) => {
                      const sender = users.find(
                        (u) => u._id === msg.sender
                      ) as User;
                      const isMe = sender._id === user?._id;
                      return (
                        <Box
                          key={msg._id}
                          sx={{
                            mb: 2,
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            gap: 1,
                          }}
                        >
                          {!isMe && (
                            <Avatar
                              sx={{ width: 32, height: 32, fontSize: 14 }}
                            >
                              {sender?.name?.[0]}
                            </Avatar>
                          )}
                          <Box sx={{ minWidth: "10%" }}>
                            <Paper
                              sx={{
                                p: 1.3,
                                bgcolor: isMe ? "#6a11cb" : "#f0f0f0",
                                color: isMe ? "white" : "black",
                                borderRadius: 2,
                              }}
                            >
                              {!isMe && selectedChat.isChatMode && (
                                <Typography variant="caption" fontWeight={600}>
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {sender?.name}

                                    {selectedChat.members.find(
                                      (m) => m.user === sender._id
                                    )?.role === "admin" && (
                                      <Crown
                                        size={12}
                                        style={{
                                          marginLeft: 4,
                                          verticalAlign: "middle",
                                        }}
                                      />
                                    )}
                                  </span>
                                </Typography>
                              )}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: "10px",
                                  alignItems: "center",
                                }}
                              >
                                {editingMessage === msg._id ? (
                                  <TextField
                                    sx={{
                                      bgcolor: "white",
                                      border: "none",
                                      outline: "none",
                                    }}
                                    size="small"
                                    fullWidth
                                    value={editText}
                                    onChange={(e) =>
                                      setEditText(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                      e.key === "Enter" && editMessage(msg._id)
                                    }
                                    slotProps={{
                                      input: {
                                        style: {
                                          borderRadius: "0",
                                        },
                                        endAdornment: (
                                          <IconButton
                                            size="small"
                                            onClick={() => editMessage(msg._id)}
                                          >
                                            <Check />
                                          </IconButton>
                                        ),
                                      },
                                    }}
                                  />
                                ) : (
                                  <Typography sx={{ display: "flex" }}>
                                    {msg.text}
                                  </Typography>
                                )}
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "10px",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{ opacity: 0.7 }}
                                  >
                                    {msg.createdAt && formatTime(msg.createdAt)}
                                  </Typography>
                                  {isMe && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 0.5,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      {msg.status === "read" ? (
                                        <CheckCheck size={14} />
                                      ) : (
                                        <Check size={14} />
                                      )}
                                      <IconButton
                                        size="small"
                                        onClick={(e) => openMessageMenu(e, msg)}
                                      >
                                        <MoreVertical size={14} />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>
                              </div>
                            </Paper>
                          </Box>
                        </Box>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </Box>

                  <Box sx={{ p: 2, borderTop: "1px solid #eee" }}>
                    <TextField
                      fullWidth
                      placeholder="Сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendMessage()
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={sendMessage} color="primary">
                              <SendHorizonal />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Диалог создания чата / добавления участника */}
      <Dialog
        open={openChatDialog}
        onClose={() => {
          setOpenChatDialog(false);
          setSelectedUsers([]);
          setChatName("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedChat ? "Добавить участника" : "Новый чат"}
        </DialogTitle>
        <DialogContent>
          {!selectedChat && (
            <TextField
              fullWidth
              label="Название группы (опционально)"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            fullWidth
            label="Поиск"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            InputProps={{ startAdornment: <Search /> }}
            sx={{ mb: 2 }}
          />
          <List>
            {users
              .filter((u) => u._id !== user?._id)
              .filter((u) =>
                u.name.toLowerCase().includes(searchUser.toLowerCase())
              )
              .filter((u) =>
                selectedChat
                  ? !selectedChat?.members?.some?.(
                      (m) => (m.user as string) === u._id
                    )
                  : true
              )
              .map((u) => (
                <ListItemButton
                  key={u._id}
                  selected={selectedUsers.includes(u._id)}
                  onClick={() =>
                    setSelectedUsers((prev) =>
                      prev.includes(u._id)
                        ? prev.filter((id) => id !== u._id)
                        : [...prev, u._id]
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{u.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={u.name} secondary={u.email} />
                </ListItemButton>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenChatDialog(false);
              setSelectedUsers([]);
              setChatName("");
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={() => {
              if (selectedChat) {
                selectedUsers.forEach((id) => addMember(id));
                setOpenChatDialog(false);
                setSelectedUsers([]);
              } else {
                createChat();
              }
            }}
            variant="contained"
            disabled={selectedUsers.length === 0}
          >
            {selectedChat ? "Добавить" : "Создать"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог участников */}
      <Dialog
        open={openMembersDialog}
        onClose={() => setOpenMembersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Участники</DialogTitle>
        <DialogContent>
          <List>
            {selectedChat?.members?.map?.((member) => {
              const memberUser = member.user as string;
              const isMe = memberUser === user?._id;
              const isAdmin = member.role === "admin";
              console.log(users, selectedChat.members);

              return (
                <div key={memberUser}>
                  <ListItemButton disabled={isMe}>
                    <ListItemAvatar>
                      <Avatar>
                        {users.find((u) => u._id === memberUser)?.name?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {users.find((u) => u._id === memberUser)?.name}
                          {isAdmin && (
                            <Chip label="Админ" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={users.find((u) => u._id === memberUser)?.email}
                    />
                    {isChatAdmin && !isMe && (
                      <>
                        <Tooltip title="Сделать админом">
                          <IconButton
                            onClick={() => changeRole(memberUser, "admin")}
                          >
                            <UserCheck size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Убрать админа">
                          <IconButton
                            onClick={() => changeRole(memberUser, "member")}
                          >
                            <UserMinus size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton
                            color="error"
                            onClick={() => removeMember(memberUser)}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </ListItemButton>
                  <Divider />
                </div>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembersDialog(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Меню сообщения */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenus}>
        <MenuItem
          onClick={() => {
            setEditingMessage(menuMessage?._id || null);
            setEditText(menuMessage?.text || "");
            closeMenus();
          }}
        >
          <Edit size={16} /> Редактировать
        </MenuItem>
        <MenuItem
          onClick={() => {
            deleteMessage(menuMessage?._id || "");
            closeMenus();
          }}
          sx={{ color: "error.main" }}
        >
          <Trash2 size={16} /> Удалить
        </MenuItem>
      </Menu>

      {/* Меню чата */}
      <Menu
        anchorEl={chatMenuAnchor}
        open={!!chatMenuAnchor}
        onClose={closeMenus}
      >
        {isChatAdmin && (
          <MenuItem
            onClick={() => {
              setOpenChatDialog(true);
              setSelectedUsers([]);
              closeMenus();
            }}
          >
            <UserPlus size={16} style={{ marginRight: 8 }} />
            Добавить участника
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (selectedChat) deleteChat(selectedChat._id);
            closeMenus();
          }}
          sx={{ color: "error.main" }}
        >
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Удалить чат
        </MenuItem>
      </Menu>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
