import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/client';

export default function PublicNewsPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/news/public/${slug}`)
      .then((res) => setPost(res.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy-950 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center font-bold">
            BH
          </div>
          <div>
            <p className="font-semibold leading-tight">Beverly Hills Academy, Wa</p>
            <p className="text-xs text-slate-400 leading-tight">News & Announcements</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/public/news" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft size={16} /> Back to News
        </Link>

        {notFound && <p className="text-slate-400">This post could not be found.</p>}

        {post && (
          <article className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {post.image_url && (
              <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover" />
            )}
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-slate-900">{post.title}</h1>
              <p className="text-sm text-slate-400 mt-2">
                {post.author_name || 'School Admin'} • {new Date(post.published_at).toLocaleDateString()}
              </p>
              <p className="text-slate-700 mt-6 whitespace-pre-wrap leading-relaxed">{post.body}</p>
            </div>
          </article>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 py-8">
        Beverly Hills Academy, Wa
      </footer>
    </div>
  );
}