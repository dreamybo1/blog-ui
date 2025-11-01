import React, { useEffect, useState } from "react";
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
} from "@mui/material";

const API_URL = "https://blog-node-km1z.onrender.com";

interface User {
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

export default function BlogPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const loadUser = React.useCallback(async () => {
    const token = localStorage.getItem("token");

    setLoading(true);
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const user = await res.json();
      setUser(user);
    }
    setLoading(false);
  }, []);

  const loadPosts = React.useCallback(async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPosts(data);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      loadUser();
      loadPosts();
    }
  }, [loadUser, loadPosts]);

  async function handleAuth(type: "login" | "register") {
    if (!auth.email || !auth.password || (type === "register" && !auth.name)) {
      alert("Заполните все поля!");
      return;
    }
    setLoading(true);
    const res = await fetch(`${API_URL}/auth/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auth),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      loadUser();
      loadPosts();
    } else alert(data.message || "Ошибка");
    setLoading(false);
  }

  async function handleCreate() {
    const token = localStorage.getItem("token");

    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/post/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      setTitle("");
      setContent("");
      loadPosts();
    }
    setLoading(false);
  }

  async function handleLike(id: string) {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/post/likePost/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadPosts();
  }

  async function handleDelete(id: string) {
    const token = localStorage.getItem("token");

    if (confirm("Удалить пост?")) {
      await fetch(`${API_URL}/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadPosts();
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        py: 6,
        px: 2,
        color: "#333",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography
          variant="h3"
          fontWeight={700}
          textAlign="center"
          sx={{ mb: 2 }}
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
            }}
          >
            <Avatar sx={{ bgcolor: "#e0e0e0", color: "#333" }}>
              {user.name[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>{user.name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {user.role}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                borderColor: "#333",
                color: "#333",
                ml: 2,
                "&:hover": { bgcolor: "rgba(0,0,0,0.05)" },
              }}
            >
              <LogOut size={16} style={{ marginRight: 4 }} /> Выйти
            </Button>
          </Box>
        )}
      </motion.div>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress sx={{ color: "#333" }} />
        </Box>
      )}

      {/* Auth */}
      {!user && (
        <Card
          sx={{
            width: "100%",
            maxWidth: 400,
            bgcolor: "#fff",
            color: "#333",
            p: 3,
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <CardHeader
            title="Авторизация"
            titleTypographyProps={{
              align: "center",
              variant: "h5",
              fontWeight: 700,
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
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              variant="outlined"
              value={auth.email}
              onChange={(e) => setAuth({ ...auth, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              variant="outlined"
              value={auth.password}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              sx={{ mb: 3 }}
            />
            <Grid container spacing={2}>
              <Grid>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleAuth("register")}
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  <UserPlus size={18} style={{ marginRight: 6 }} /> Регистрация
                </Button>
              </Grid>
              <Grid >
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleAuth("login")}
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  <LogIn size={18} style={{ marginRight: 6 }} /> Вход
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Blog */}
      {user && (
        <Container maxWidth="sm">
          {/* Create post */}
          <Card
            sx={{
              bgcolor: "#fff",
              borderRadius: 2,
              mt: 2,
              mb: 4,
              p: 2,
              color: "#333",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <CardHeader
              title="Создать пост"
              titleTypographyProps={{
                variant: "h6",
                fontWeight: 600,
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
              />
              <TextField
                fullWidth
                label="Текст поста"
                multiline
                minRows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreate}
                sx={{
                  bgcolor: "#1976d2",
                  "&:hover": { bgcolor: "#1565c0" },
                }}
              >
                <SendHorizonal size={18} style={{ marginRight: 6 }} /> Создать
              </Button>
            </CardContent>
          </Card>

          {/* Posts */}
          {posts.length === 0 && (
            <Typography textAlign="center" sx={{ opacity: 0.7 }}>
              Постов пока нет 💤
            </Typography>
          )}
          <Box display="flex" flexDirection="column" gap={3}>
            {posts.map((p) => (
              <motion.div
                key={p._id}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Card
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: 2,
                    color: "#333",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: "#e0e0e0", color: "#333" }}>
                        {p.author.name[0]}
                      </Avatar>
                    }
                    title={p.author.name}
                    subheader={p.author.role}
                    subheaderTypographyProps={{ color: "#666" }}
                    titleTypographyProps={{ fontWeight: 600 }}
                  />
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      {p.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: "#555" }}>
                      {p.content}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "space-between" }}>
                    <IconButton
                      onClick={() => handleLike(p._id)}
                      sx={{ color: "#1976d2" }}
                    >
                      <Heart />
                      <Typography sx={{ ml: 0.5 }}>{p.likes.length}</Typography>
                    </IconButton>
                    {user.role === "admin" && (
                      <IconButton
                        onClick={() => handleDelete(p._id)}
                        sx={{ color: "#ff6666" }}
                      >
                        <Trash2 />
                      </IconButton>
                    )}
                  </CardActions>
                </Card>
              </motion.div>
            ))}
          </Box>
        </Container>
      )}
    </Box>
  );
}
