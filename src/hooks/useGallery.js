import { useCallback, useEffect, useState } from "react";
import { requireAdminStorageAccess, saveGalleryPost, setGalleryPostActive } from "../lib/api";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

function getGalleryClient() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado para carregar a galeria.");
  }

  return supabase;
}

// ALTERACAO: hook dedicado da galeria com CRUD direto em tabela + Storage, sem Edge Function.
function normalizeManagedPost(row) {
  return {
    id: row.id,
    title: row.title ?? "",
    caption: row.caption ?? "",
    tag: row.tag ?? "",
    image_path: row.image_path ?? row.imagePath ?? "",
    image_url: row.image_url ?? row.imageUrl ?? "",
    sort_order: row.sort_order ?? row.sortOrder ?? 0,
    is_active: Boolean(row.is_active ?? row.isActive ?? true)
  };
}

export function useGallery({ adminMode = false, sessionProfile = null } = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setPosts([]);
      setError("Supabase nao configurado para carregar a galeria.");
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    let query = getGalleryClient().from("gallery_posts").select("*").order("sort_order", { ascending: true });

    if (!adminMode) {
      query = query.eq("is_active", true);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setPosts([]);
      setError(queryError.message);
      setLoading(false);
      return [];
    }

    const nextPosts = data ?? [];
    setPosts(nextPosts);
    setLoading(false);
    return nextPosts;
  }, [adminMode]);

  useEffect(() => {
    let active = true;

    async function load() {
      const nextPosts = await loadPosts();

      if (!active) {
        return;
      }

      setPosts(nextPosts);
    }

    load();

    return () => {
      active = false;
    };
  }, [loadPosts]);

  const uploadImage = useCallback(async (file) => {
    const supabase = getGalleryClient();
    await requireAdminStorageAccess(sessionProfile);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `posts/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file, { upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // ALTERACAO: persistimos URL publica e path para o cliente nao depender de resolucao local.
    const { data } = supabase.storage.from("gallery").getPublicUrl(path);

    return { path, url: data.publicUrl };
  }, [sessionProfile]);

  const savePost = useCallback(
    async (form, imageFile) => {
      if (sessionProfile?.authMode === "app_users" && !imageFile) {
        const saved = await saveGalleryPost(
          {
            id: form.id,
            title: form.title,
            caption: form.caption,
            tag: form.tag,
            imagePath: form.image_path ?? "",
            sortOrder: form.sort_order,
            isActive: form.is_active ?? true
          },
          sessionProfile
        );
        const normalized = normalizeManagedPost(saved.data);

        setPosts((current) => {
          const nextPosts = form.id
            ? current.map((post) => (post.id === normalized.id ? normalized : post))
            : [...current, normalized];
          return nextPosts.slice().sort((a, b) => a.sort_order - b.sort_order);
        });

        return normalized;
      }

      const supabase = getGalleryClient();
      let imagePath = form.image_path ?? null;
      let imageUrl = form.image_url ?? null;

      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        imagePath = uploaded.path;
        imageUrl = uploaded.url;
      }

      const payload = {
        title: form.title.trim(),
        caption: form.caption?.trim() ?? "",
        tag: form.tag?.trim() || "geral",
        sort_order: Number(form.sort_order) || 1,
        is_active: form.is_active ?? true,
        image_path: imagePath ?? null,
        image_url: imageUrl ?? null
      };

      const query = form.id
        ? supabase.from("gallery_posts").update(payload).eq("id", form.id)
        : supabase.from("gallery_posts").insert(payload);

      const { data, error: saveError } = await query.select().single();

      if (saveError) {
        throw new Error(saveError.message);
      }

      const normalized = normalizeManagedPost(data);

      setPosts((current) => {
        const nextPosts = form.id
          ? current.map((post) => (post.id === normalized.id ? normalized : post))
          : [...current, normalized];
        return nextPosts.slice().sort((a, b) => a.sort_order - b.sort_order);
      });

      return normalized;
    },
    [sessionProfile, uploadImage]
  );

  const toggleActive = useCallback(async (post) => {
    if (sessionProfile?.authMode === "app_users") {
      const updated = await setGalleryPostActive(post.id, !post.is_active, sessionProfile);
      const normalized = normalizeManagedPost(updated.data);
      setPosts((current) => current.map((item) => (item.id === post.id ? normalized : item)));
      return normalized;
    }

    const { data, error: updateError } = await getGalleryClient()
      .from("gallery_posts")
      .update({ is_active: !post.is_active })
      .eq("id", post.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    const normalized = normalizeManagedPost(data);
    setPosts((current) => current.map((item) => (item.id === post.id ? normalized : item)));
    return normalized;
  }, [sessionProfile]);

  const deletePost = useCallback(async (id) => {
    const { error: deleteError } = await getGalleryClient().from("gallery_posts").delete().eq("id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    setPosts((current) => current.filter((post) => post.id !== id));
  }, []);

  return {
    posts,
    loading,
    error,
    reload: loadPosts,
    savePost,
    toggleActive,
    deletePost,
    uploadImage
  };
}
