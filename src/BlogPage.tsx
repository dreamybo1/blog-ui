import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Trash2,
  LogIn,
  UserPlus,
  SendHorizonal,
  LogOut,
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
  Grid,
  IconButton,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";

const API_URL = "https://blog-node-km1z.onrender.com";

interface User {
  name: string;
  email: string;
  _id: string;
  role: "user" | "admin";
}

interface Post {
  _id: string;
  title: string;
  content: string;
  author: { name: string; email: string; role: string };
  likes: string[];
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

  const isAdmin = user?.role === "admin";

  const showToast = (
    message: string,
    severity: "success" | "error" | "info" = "info"
  ) => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem("token");
        showToast("Сессия истекла. Войдите снова.", "error");
      }
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
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        throw new Error("Не удалось загрузить посты");
      }
    } catch {
      showToast("Ошибка загрузки постов", "error");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUser();
      loadPosts();
    } else {
      loadPosts(); // Load public posts even if not logged in
    }
  }, [loadUser, loadPosts]);

  async function handleAuth(type: "login" | "register") {
    if (!auth.email || !auth.password || (type === "register" && !auth.name)) {
      showToast("Заполните все поля!", "error");
      return;
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
        await loadPosts();
        showToast(
          type === "login" ? "Добро пожаловать!" : "Регистрация успешна!",
          "success"
        );
      } else {
        showToast(data.message || "Ошибка авторизации", "error");
      }
    } catch {
      showToast("Сервер недоступен", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!title.trim() || !content.trim()) {
      showToast("Заполните заголовок и текст", "error");
      return;
    }

    const token = localStorage.getItem("token");
    const newPost: Post = {
      _id: `temp-${Date.now()}`,
      title,
      content,
      author: { name: user!.name, email: user!.email, role: user!.role },
      likes: [],
    };

    // Optimistic UI
    setPosts((prev) => [newPost, ...prev]);
    setTitle("");
    setContent("");
    showToast("Пост создаётся...", "info");

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
        setPosts((prev) =>
          prev.map((p) => (p._id === newPost._id ? created : p))
        );
        showToast("Пост опубликован!", "success");
      } else {
        throw new Error("Не удалось создать пост");
      }
    } catch {
      setPosts((prev) => prev.filter((p) => p._id !== newPost._id));
      showToast("Не удалось создать пост", "error");
    }
  }

  async function handleLike(id: string) {
    const token = localStorage.getItem("token");
    if (!user) {
      showToast("Войдите, чтобы лайкать", "error");
      return;
    }

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== id) return p;
        const alreadyLiked = p.likes.includes(user._id);
        return {
          ...p,
          likes: alreadyLiked
            ? p.likes.filter((uid) => uid !== user._id)
            : [...p.likes, user._id],
        };
      })
    );

    try {
      const res = await fetch(`${API_URL}/post/${id}/like`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Like failed");
      }
      // Optionally refetch or trust optimistic
    } catch {
      showToast("Ошибка лайка", "error");
      loadPosts(); // Revert on error
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить пост?")) return;

    const token = localStorage.getItem("token");

    // Optimistic delete
    setPosts((prev) => prev.filter((p) => p._id !== id));
    showToast("Удаление...", "info");

    try {
      const res = await fetch(`${API_URL}/post/${id}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast("Пост удалён", "success");
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      showToast("Не удалось удалить пост", "error");
      loadPosts(); // Revert
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    showToast("Вы вышли из аккаунта", "info");
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)",
        py: 6,
        px: 2,
        color: "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h3"
          fontWeight={800}
          textAlign="center"
          sx={{
            mb: 2,
            background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          DreamNet ✨
        </Typography>

        {user && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              mb: 4,
              flexWrap: "wrap",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#6a11cb",
                fontWeight: "bold",
                boxShadow: "0 0 10px rgba(106, 17, 203, 0.4)",
              }}
            >
              {user.name[0].toUpperCase()}
            </Avatar>
            <Box textAlign="center">
              <Typography fontWeight={600} color="#333">
                {user.name}
              </Typography>
              <Typography variant="caption" color="primary">
                {user.role === "admin" ? "👑 Админ" : "✨ Пользователь"}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={handleLogout}
              startIcon={<LogOut size={16} />}
              sx={{
                borderColor: "#6a11cb",
                color: "#6a11cb",
                fontWeight: 500,
                "&:hover": { bgcolor: "rgba(106, 17, 203, 0.08)" },
              }}
            >
              Выйти
            </Button>
          </Box>
        )}
      </motion.div>

      {/* Global Loading */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: "#6a11cb" }} />
          <Typography color="text.secondary">Загрузка...</Typography>
        </Box>
      )}

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Auth Form */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          <Card
            sx={{
              bgcolor: "#fff",
              p: 4,
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              border: "1px solid rgba(106, 17, 203, 0.2)",
            }}
          >
            <CardHeader
              title="Добро пожаловать! 🚀"
              titleTypographyProps={{
                align: "center",
                variant: "h5",
                fontWeight: 700,
                color: "#6a11cb",
              }}
            />
            <CardContent>
              <TextField
                fullWidth
                label="Имя"
                variant="outlined"
                value={auth.name}
                onChange={(e) => setAuth({ ...auth, name: e.target.value })}
                sx={{ mb: 2 }}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                value={auth.email}
                onChange={(e) => setAuth({ ...auth, email: e.target.value })}
                sx={{ mb: 2 }}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                variant="outlined"
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                sx={{ mb: 3 }}
                disabled={loading}
              />
              <Grid container spacing={2}>
                <Grid>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleAuth("register")}
                    startIcon={<UserPlus size={18} />}
                    disabled={loading}
                    sx={{
                      height: 48,
                      fontWeight: 600,
                      borderColor: "#6a11cb",
                      color: "#6a11cb",
                      "&:hover": { bgcolor: "rgba(106, 17, 203, 0.08)" },
                    }}
                  >
                    Регистрация
                  </Button>
                </Grid>
                <Grid>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleAuth("login")}
                    startIcon={<LogIn size={18} />}
                    disabled={loading}
                    sx={{
                      height: 48,
                      fontWeight: 600,
                      bgcolor: "#6a11cb",
                      "&:hover": { bgcolor: "#5a0db8" },
                    }}
                  >
                    Вход
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Blog Content */}
      {user && (
        <Container maxWidth="sm">
          {/* Create Post */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              sx={{
                bgcolor: "#fff",
                borderRadius: 3,
                mt: 2,
                mb: 4,
                p: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid rgba(106, 17, 203, 0.15)",
              }}
            >
              <CardHeader
                title="Что у вас нового? 🌟"
                titleTypographyProps={{
                  variant: "h6",
                  fontWeight: 600,
                  color: "#6a11cb",
                }}
              />
              <CardContent>
                <TextField
                  fullWidth
                  label="Заголовок"
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Поделитесь мыслями..."
                  multiline
                  minRows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCreate}
                  disabled={loading || !title.trim() || !content.trim()}
                  startIcon={<SendHorizonal size={18} />}
                  sx={{
                    height: 48,
                    fontWeight: 600,
                    bgcolor: "#6a11cb",
                    "&:hover": { bgcolor: "#5a0db8" },
                  }}
                >
                  Опубликовать
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Posts List */}
          {!posts.length && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Typography
                textAlign="center"
                sx={{ opacity: 0.7, fontStyle: "italic", mt: 4 }}
              >
                Постов пока нет... Будьте первым! ✨
              </Typography>
            </motion.div>
          ) : (
            <Box display="flex" flexDirection="column" gap={3}>
              {posts.map((p, index) => {
                const isPostAdmin = p.author.role === "admin";
                const isLiked = user ? p.likes.includes(user._id) : false;

                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  >
                    <Card
                      sx={{
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
                        title={
                          <Typography fontWeight={600} color="#333">
                            {p.author.name}
                          </Typography>
                        }
                        subheader={
                          <Typography
                            variant="caption"
                            color={isPostAdmin ? "#d32f2f" : "text.secondary"}
                          >
                            {isPostAdmin ? "👑 Админ" : "Пользователь"}
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="#222"
                          gutterBottom
                        >
                          {p.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="#444"
                          lineHeight={1.6}
                        >
                          {p.content}
                        </Typography>
                      </CardContent>
                      <CardActions
                        sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
                      >
                        <IconButton
                          onClick={() => handleLike(p._id)}
                          sx={{
                            color: isLiked ? "#ff1744" : "#666",
                            transition: "all 0.2s",
                            "&:hover": { transform: "scale(1.1)" },
                            ":focus": { outline: 0 },
                          }}
                        >
                          <motion.div
                            animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Heart
                              size={20}
                              fill={isLiked ? "#ff1744" : "none"}
                              strokeWidth={2}
                            />
                          </motion.div>
                          <Typography sx={{ ml: 0.5, fontWeight: 500 }}>
                            {p.likes.length}
                          </Typography>
                        </IconButton>

                        {(p.author.email === user.email || isAdmin) && (
                          <IconButton
                            onClick={() => handleDelete(p._id)}
                            sx={{
                              color: "#ff4444",
                              "&:hover": { bgcolor: "rgba(255,68,68,0.1)" },
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        )}
                      </CardActions>
                    </Card>
                  </motion.div>
                );
              })}
            </Box>
          )}
        </Container>
      )}
    </Box>
  );
}
