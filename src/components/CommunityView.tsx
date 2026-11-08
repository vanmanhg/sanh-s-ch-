import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ForumCategory, CommunityPost } from '../types';
import {
  Users,
  MessageSquare,
  Heart,
  Plus,
  Image as ImageIcon,
  Send,
  MapPin,
  CheckCircle,
  X,
  HelpCircle,
  Sparkles,
  Check,
  Phone,
  Gift,
  Search,
  AlertCircle,
  Copy,
  Loader2,
  Layers,
  Award,
  ThumbsUp
} from 'lucide-react';

export const CommunityView: React.FC = () => {
  const {
    posts,
    addPost,
    likePost,
    togglePostSolved,
    claimPostSeed,
    addComment,
    toggleCommentSolution,
    likeComment,
    farmLocation
  } = useApp();

  // Tab & Filter states
  const [activeCategory, setActiveCategory] = useState<ForumCategory | 'all'>('all');
  const [qaStatusFilter, setQaStatusFilter] = useState<'all' | 'unsolved' | 'solved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Create post modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [postTitle, setPostTitle] = useState<string>('');
  const [postCategory, setPostCategory] = useState<ForumCategory>('qa');
  const [postContent, setPostContent] = useState<string>('');
  const [postTags, setPostTags] = useState<string>('HỏiĐápLàmVườn, CâyTrồng');
  const [postImageUrls, setPostImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState<string>('');

  // Seed details for seed_exchange category
  const [seedName, setSeedName] = useState<string>('');
  const [seedQuantity, setSeedQuantity] = useState<string>('30 phần (25 hạt/phần)');
  const [seedMaxClaims, setSeedMaxClaims] = useState<number>(30);
  const [seedDelivery, setSeedDelivery] = useState<'direct' | 'post' | 'both'>('both');
  const [seedPhone, setSeedPhone] = useState<string>('0909.123.456');
  const [seedLocation, setSeedLocation] = useState<string>(farmLocation.address.split(',')[0]);

  // Comment & AI diagnosis states
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [commentImageUrl, setCommentImageUrl] = useState<string>('');
  const [isAiDiagnosing, setIsAiDiagnosing] = useState<string | null>(null); // postId currently being answered by AI
  const [claimedNotice, setClaimedNotice] = useState<{ title: string; phone: string } | null>(null);

  // Lightbox preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Presets for quick photo insertion
  const SAMPLE_IMAGES = [
    { label: 'Cà chua bi', url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=700&q=80' },
    { label: 'Sầu riêng', url: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=700&q=80' },
    { label: 'Rau ban công', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=700&q=80' },
    { label: 'Hạt giống', url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&w=700&q=80' },
    { label: 'Hoa lan', url: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=700&q=80' }
  ];

  // Filter posts
  const filteredPosts = posts.filter(post => {
    // Category filter
    if (activeCategory !== 'all') {
      const pCat = post.category || 'experience';
      if (pCat !== activeCategory) return false;
    }

    // QA status sub-filter
    if (activeCategory === 'qa' || (activeCategory === 'all' && post.category === 'qa')) {
      if (qaStatusFilter === 'unsolved' && post.isSolved) return false;
      if (qaStatusFilter === 'solved' && !post.isSolved) return false;
    }

    // Tag filter
    if (selectedTag !== 'all' && !post.tags.includes(selectedTag)) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (post.title || '').toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.author.name.toLowerCase().includes(q);
      const matchTags = post.tags.some(t => t.toLowerCase().includes(q));
      const matchSeed = post.seedDetails?.seedName.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor && !matchTags && !matchSeed) {
        return false;
      }
    }

    return true;
  });

  // Handle create post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const parsedTags = postTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (parsedTags.length === 0) {
      parsedTags.push(
        postCategory === 'qa'
          ? 'HỏiĐáp'
          : postCategory === 'seed_exchange'
          ? 'TraoĐổiHạtGiống'
          : postCategory === 'showcase'
          ? 'KhoeVườnXanh'
          : 'KinhNghiệm'
      );
    }

    const newPostData: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments'> = {
      category: postCategory,
      title: postTitle.trim() || undefined,
      author: {
        name: 'Tôi (Chủ Vườn Nông Trợ)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        badge: 'Thành viên Tích Cực',
        location: farmLocation.address.split(',')[0] || 'Việt Nam'
      },
      content: postContent,
      tags: parsedTags,
      images: postImageUrls,
      isSolved: postCategory === 'qa' ? false : undefined,
      seedDetails:
        postCategory === 'seed_exchange'
          ? {
              seedName: seedName.trim() || 'Hạt giống rau quả hữu cơ',
              quantity: seedQuantity.trim() || '30 phần',
              deliveryMethod: seedDelivery,
              phone: seedPhone.trim() || '0909.123.456',
              location: seedLocation.trim() || farmLocation.address.split(',')[0],
              claimedCount: 0,
              maxClaims: seedMaxClaims || 30
            }
          : undefined
    };

    addPost(newPostData);

    // Reset form
    setPostTitle('');
    setPostContent('');
    setPostImageUrls([]);
    setImageInput('');
    setSeedName('');
    setShowCreateModal(false);
  };

  // Image upload from local file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPostImageUrls(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Send comment
  const handleSendComment = (postId: string) => {
    if (!commentText.trim() && !commentImageUrl.trim()) return;

    addComment(postId, commentText, 'Tôi (Nhà nông)', {
      images: commentImageUrl.trim() ? [commentImageUrl.trim()] : []
    });

    setCommentText('');
    setCommentImageUrl('');
  };

  // AI Instant Diagnosis for Q&A post
  const handleAiDiagnose = async (post: CommunityPost) => {
    setIsAiDiagnosing(post.id);
    setActiveCommentPostId(post.id);

    try {
      const prompt = `Bạn là Bác Sĩ Cây Trồng & Chuyên gia Nông nghiệp cao cấp (Nông Trợ Xanh AI). Hãy phân tích và giải đáp cho bài viết hỏi đáp làm vườn sau:
Tiêu đề: ${post.title || 'Câu hỏi làm vườn'}
Nội dung vấn đề: ${post.content}
Các thẻ liên quan: ${post.tags.join(', ')}

Hãy đưa ra giải pháp chăm sóc và xử lý chi tiết, thực tế, ân cần và dễ hiểu cho nhà nông theo định dạng:
1. Chẩn đoán nguyên nhân khả dĩ nhất
2. Các bước xử lý ngay lập tức (ưu tiên an toàn, hữu cơ, sinh học như dầu neem, trichoderma, nước tỏi ớt...)
3. Biện pháp phòng ngừa lâu dài.`;

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: prompt })
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        data.fallbackReply ||
        'Bác sĩ AI khuyên bạn nên cách ly chậu cây bị bệnh, ngưng tưới đạm, xịt dầu Neem hữu cơ 5ml/lít nước vào buổi chiều mát và cắm bẫy dính vàng để loại trừ côn trùng truyền bệnh.';

      addComment(post.id, replyText, 'Bác Sĩ Cây Trồng AI (Gemini Flash)', {
        isExpert: true,
        isHelpfulSolution: true
      });
    } catch (err) {
      console.error('AI diagnosis error:', err);
      addComment(
        post.id,
        '💡 Lời khuyên nhanh từ Bác Sĩ Cây Trồng AI: Hãy kiểm tra độ ẩm bầu đất, cắt tỉa cành lá héo vàng đem tiêu hủy và phun xịt vi sinh đối kháng Trichoderma hoặc dầu neem 5ml/lít nước lúc trời mát để bảo vệ cây.',
        'Bác Sĩ Cây Trồng AI (Gemini Flash)',
        { isExpert: true, isHelpfulSolution: true }
      );
    } finally {
      setIsAiDiagnosing(null);
    }
  };

  // Handle claim seed in post
  const handleClaimSeed = (post: CommunityPost) => {
    if (!post.seedDetails) return;
    const ok = claimPostSeed(post.id);
    if (ok) {
      setClaimedNotice({
        title: post.seedDetails.seedName,
        phone: post.seedDetails.phone
      });
    } else {
      alert('Đã hết số lượng phần hạt giống dành cho bài viết này!');
    }
  };

  // Social share
  const handleShareToSocial = (platform: string, post: CommunityPost) => {
    const url = window.location.href;
    const title = post.title || post.content.substring(0, 60);
    const text = encodeURIComponent(`[Diễn Đàn Làm Vườn Nông Trợ Xanh] ${title}`);

    if (platform === 'zalo') {
      window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}&title=${text}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(url)}`, '_blank');
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`${title} - ${url}`);
        alert('Đã sao chép liên kết bài viết vào clipboard!');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* FORUM HEADER */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-green-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Users className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
              <Users className="w-3.5 h-3.5" />
              <span>Diễn Đàn Làm Vườn & Nông Nghiệp Xanh</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              Cộng Đồng Yêu Cây & Trao Đổi Hạt Giống
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Hỏi đáp sâu bệnh với Bác sĩ AI, nhận và tặng hạt giống miễn phí, chia sẻ kinh nghiệm ủ phân hữu cơ và khoe góc vườn xanh mướt.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>Đăng Bài Lên Diễn Đàn</span>
          </button>
        </div>

        {/* Community Stats Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-5 mt-5 border-t border-emerald-700/50 text-xs">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 text-center">
            <span className="block text-lg font-black">{posts.length}</span>
            <span className="text-[11px] text-emerald-200">Bài thảo luận</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 text-center">
            <span className="block text-lg font-black text-amber-300">
              {posts.filter(p => p.category === 'qa').length}
            </span>
            <span className="text-[11px] text-emerald-200">Hỏi đáp bệnh cây</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 text-center">
            <span className="block text-lg font-black text-teal-300">
              {posts.filter(p => p.category === 'seed_exchange').length}
            </span>
            <span className="text-[11px] text-emerald-200">Trao đổi hạt giống</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 text-center">
            <span className="block text-lg font-black text-rose-300">
              {posts.reduce((sum, p) => sum + p.comments.length, 0)}
            </span>
            <span className="text-[11px] text-emerald-200">Bình luận & giải pháp</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất Cả Bài Viết</span>
          </button>

          <button
            onClick={() => setActiveCategory('qa')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'qa'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>❓ Hỏi Đáp Bệnh & Kỹ Thuật</span>
          </button>

          <button
            onClick={() => setActiveCategory('seed_exchange')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'seed_exchange'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>🌱 Trao Đổi Hạt Giống</span>
          </button>

          <button
            onClick={() => setActiveCategory('experience')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'experience'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>💡 Kinh Nghiệm & Mẹo Hay</span>
          </button>

          <button
            onClick={() => setActiveCategory('showcase')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeCategory === 'showcase'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>🌸 Khoe Vườn Xanh</span>
          </button>
        </div>

        {/* Sub-bar: Search Input & Q&A Status Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm câu hỏi, tên giống cây, sâu bệnh, tên người đăng..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* If Q&A is relevant, display filter */}
          {(activeCategory === 'qa' || activeCategory === 'all') && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs shrink-0 self-start sm:self-auto">
              <span className="text-[11px] text-zinc-500 px-1 font-medium">Trạng thái:</span>
              <button
                onClick={() => setQaStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                  qaStatusFilter === 'all'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setQaStatusFilter('unsolved')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                  qaStatusFilter === 'unsolved'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                ⏳ Đang chờ
              </button>
              <button
                onClick={() => setQaStatusFilter('solved')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                  qaStatusFilter === 'solved'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                ✓ Đã giải quyết
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FEED LIST */}
      <div className="space-y-5">
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
              Không tìm thấy bài viết nào phù hợp
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Hãy thử tìm kiếm với từ khóa khác, hoặc là người đầu tiên đăng bài trong danh mục này!
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setQaStatusFilter('all');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              Xem tất cả bài viết
            </button>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isQA = post.category === 'qa';
            const isSeed = post.category === 'seed_exchange' && post.seedDetails;
            const isShowcase = post.category === 'showcase';

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all space-y-4"
              >
                {/* Post Top Row: Category Tag & Solved Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Category Label */}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 ${
                        isQA
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : isSeed
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : isShowcase
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isQA && <HelpCircle className="w-3 h-3" />}
                      {isSeed && <Gift className="w-3 h-3" />}
                      {isShowcase && <ImageIcon className="w-3 h-3" />}
                      {!isQA && !isSeed && !isShowcase && <Sparkles className="w-3 h-3" />}
                      <span>
                        {isQA
                          ? 'Hỏi Đáp Sâu Bệnh'
                          : isSeed
                          ? 'Trao Đổi Hạt Giống'
                          : isShowcase
                          ? 'Khoe Vườn Xanh'
                          : 'Kinh Nghiệm Canh Tác'}
                      </span>
                    </span>

                    {/* Q&A Solved Status */}
                    {isQA && (
                      <button
                        onClick={() => togglePostSolved(post.id)}
                        title="Bấm để thay đổi trạng thái câu hỏi"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          post.isSolved
                            ? 'bg-emerald-500 text-white shadow-2xs hover:bg-emerald-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        {post.isSolved ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Đã Giải Quyết</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Chờ Giải Đáp</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-zinc-400">{post.createdAt}</span>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        {post.author.name}
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        {post.author.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{post.author.location}</span>
                    </div>
                  </div>
                </div>

                {/* Title (if any) */}
                {post.title && (
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {post.title}
                  </h3>
                )}

                {/* Content */}
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* SEED EXCHANGE CARD (Special widget inside seed exchange posts) */}
                {isSeed && post.seedDetails && (
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl p-4 border border-teal-200 dark:border-teal-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-teal-600" />
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-teal-950 dark:text-teal-100">
                            Hạt Giống: {post.seedDetails.seedName}
                          </h4>
                          <span className="text-[11px] text-teal-700 dark:text-teal-300">
                            Số lượng chia sẻ: {post.seedDetails.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Claim Button */}
                      {post.seedDetails.claimedCount < post.seedDetails.maxClaims ? (
                        <button
                          onClick={() => handleClaimSeed(post)}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Đăng Ký Nhận Hạt</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-xs rounded-xl">
                          Đã phát hết
                        </span>
                      )}
                    </div>

                    {/* Progress Bar of claims */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                        <span>Tiến độ nhận hạt:</span>
                        <span className="font-bold text-teal-800 dark:text-teal-300">
                          {post.seedDetails.claimedCount} / {post.seedDetails.maxClaims} phần đã trao
                        </span>
                      </div>
                      <div className="w-full h-2 bg-teal-100 dark:bg-teal-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (post.seedDetails.claimedCount / post.seedDetails.maxClaims) * 100
                            )}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Delivery & Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>Khu vực: {post.seedDetails.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>Liên hệ / Zalo: <strong>{post.seedDetails.phone}</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PHOTO GALLERY (Supporting 1, 2, 3 or more photos) */}
                {post.images && post.images.length > 0 && (
                  <div
                    className={`grid gap-2 rounded-2xl overflow-hidden ${
                      post.images.length === 1
                        ? 'grid-cols-1'
                        : post.images.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    }`}
                  >
                    {post.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImageUrl(img)}
                        className="group relative cursor-pointer overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
                      >
                        <img
                          src={img}
                          alt={`Post attachment ${idx + 1}`}
                          className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            post.images.length === 1 ? 'h-72 sm:h-96' : 'h-40 sm:h-52'
                          }`}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          <span>🔍 Bấm để phóng to</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(selectedTag === t ? 'all' : t)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        selectedTag === t
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>

                {/* ACTION BAR: Likes, Comments, Ask AI Gemini, Share */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Like button */}
                    <button
                      onClick={() => likePost(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                        post.isLiked
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    {/* Toggle Comment Button */}
                    <button
                      onClick={() =>
                        setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        activeCommentPostId === post.id
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments.length} Bình luận</span>
                    </button>

                    {/* Ask AI Gemini Agronomist Button (for Q&A or any post) */}
                    <button
                      onClick={() => handleAiDiagnose(post)}
                      disabled={isAiDiagnosing === post.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs shadow-2xs hover:brightness-110 cursor-pointer disabled:opacity-50"
                      title="Nhờ Bác Sĩ Cây Trồng AI phân tích và trả lời ngay vào bài viết"
                    >
                      {isAiDiagnosing === post.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>AI Đang Phân Tích...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>Hỏi Bác Sĩ AI Gemini</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-zinc-400 hidden sm:inline mr-0.5">Chia sẻ:</span>
                    <button
                      onClick={() => handleShareToSocial('zalo', post)}
                      className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100"
                    >
                      Zalo
                    </button>
                    <button
                      onClick={() => handleShareToSocial('facebook', post)}
                      className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100"
                    >
                      FB
                    </button>
                    <button
                      onClick={() => handleShareToSocial('telegram', post)}
                      className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold hover:bg-sky-100"
                    >
                      Telegram
                    </button>
                    <button
                      onClick={() => handleShareToSocial('copy', post)}
                      className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Sao chép liên kết"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* EXPANDED COMMENT SECTION */}
                {activeCommentPostId === post.id && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <span>Các câu trả lời & kinh nghiệm ({post.comments.length})</span>
                      {isQA && (
                        <span className="text-[11px] text-zinc-400">
                          Bấm dấu ✓ để chọn giải pháp đúng nhất
                        </span>
                      )}
                    </div>

                    {/* Comments list */}
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {post.comments.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-2 text-center">
                          Chưa có phản hồi nào. Hãy là người đầu tiên chia sẻ giải pháp hoặc bấm &quot;Hỏi Bác Sĩ AI Gemini&quot;!
                        </p>
                      ) : (
                        post.comments.map(c => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-2xl text-xs space-y-2 transition-all ${
                              c.isHelpfulSolution
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700'
                                : c.isExpert
                                ? 'bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800'
                                : 'bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={c.avatar}
                                  alt={c.author}
                                  className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                                      {c.author}
                                    </span>
                                    {c.isExpert && (
                                      <span className="px-1.5 py-0.2 bg-teal-600 text-white text-[9px] font-bold rounded flex items-center gap-0.5">
                                        <Award className="w-2.5 h-2.5" />
                                        <span>Chuyên gia Nông Nghiệp</span>
                                      </span>
                                    )}
                                    {c.isHelpfulSolution && (
                                      <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Giải Pháp Hữu Ích Đã Chọn</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-zinc-400">{c.createdAt}</span>
                                </div>
                              </div>

                              {/* Solution picker & Like */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => likeComment(post.id, c.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                    c.isLiked
                                      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                                      : 'text-zinc-400 hover:text-zinc-600'
                                  }`}
                                >
                                  <ThumbsUp className={`w-3 h-3 ${c.isLiked ? 'fill-rose-500' : ''}`} />
                                  <span>{c.likes || 0}</span>
                                </button>

                                {isQA && (
                                  <button
                                    onClick={() => toggleCommentSolution(post.id, c.id)}
                                    className={`p-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                      c.isHelpfulSolution
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                    title={c.isHelpfulSolution ? 'Bỏ đánh dấu giải pháp' : 'Đánh dấu đây là giải pháp đúng cho câu hỏi'}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Comment text */}
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line pl-9">
                              {c.content}
                            </p>

                            {/* Comment attachments */}
                            {c.images && c.images.length > 0 && (
                              <div className="pl-9 pt-1">
                                <img
                                  src={c.images[0]}
                                  alt="Comment attachment"
                                  onClick={() => setPreviewImageUrl(c.images![0])}
                                  className="w-32 h-24 object-cover rounded-xl cursor-pointer hover:opacity-90 border border-zinc-200 dark:border-zinc-700"
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment input box */}
                    <div className="space-y-2 pt-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendComment(post.id);
                            }
                          }}
                          placeholder="Viết phản hồi hoặc chia sẻ mẹo xử lý..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => handleSendComment(post.id)}
                          disabled={!commentText.trim() && !commentImageUrl.trim()}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer disabled:opacity-40 flex items-center gap-1 font-bold text-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi</span>
                        </button>
                      </div>

                      {/* Optional comment image URL */}
                      <div className="flex items-center gap-2 text-xs">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="url"
                          placeholder="Đính kèm link ảnh minh họa cho câu trả lời (tùy chọn)..."
                          value={commentImageUrl}
                          onChange={e => setCommentImageUrl(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-[11px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  Đăng Bài Viết Lên Diễn Đàn
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              {/* Category Selector */}
              <div>
                <label className="font-bold block mb-1.5 text-zinc-800 dark:text-zinc-200">
                  Chọn thể loại bài viết
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPostCategory('qa')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      postCategory === 'qa'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-extrabold'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="block text-[11px]">Hỏi Đáp Bệnh Cây</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostCategory('seed_exchange')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      postCategory === 'seed_exchange'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-200 font-extrabold'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Gift className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                    <span className="block text-[11px]">Tặng Hạt Giống</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostCategory('experience')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      postCategory === 'experience'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-extrabold'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-[11px]">Kinh Nghiệm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostCategory('showcase')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      postCategory === 'showcase'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 font-extrabold'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span className="block text-[11px]">Khoe Vườn</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                  Tiêu đề bài viết
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    postCategory === 'qa'
                      ? 'Ví dụ: Cây dưa leo bị héo xanh rũ lá vào buổi trưa, làm sao cứu?'
                      : postCategory === 'seed_exchange'
                      ? 'Ví dụ: Tặng 30 phần hạt giống Xà lách tím & Ớt chuông F1 cho anh em'
                      : 'Ví dụ: Cách ủ phân chuối trứng sữa tưới hoa hồng bật mầm tua tủa'
                  }
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold"
                />
              </div>

              {/* Special Fields for Seed Exchange */}
              {postCategory === 'seed_exchange' && (
                <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="font-extrabold text-xs text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-teal-600" />
                    <span>Chi Tiết Gói Quà Hạt Giống Tặng Miễn Phí</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                        Tên giống hạt chia sẻ *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Cà chua Cherry ngọt F1"
                        value={seedName}
                        onChange={e => setSeedName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                        Số phần quà & số hạt/phần
                      </label>
                      <input
                        type="text"
                        value={seedQuantity}
                        onChange={e => setSeedQuantity(e.target.value)}
                        placeholder="Ví dụ: 30 phần (30 hạt/gói)"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                        Số lượng tối đa người nhận
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={seedMaxClaims}
                        onChange={e => setSeedMaxClaims(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                        Hình thức nhận
                      </label>
                      <select
                        value={seedDelivery}
                        onChange={e => setSeedDelivery(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      >
                        <option value="both">Cả hai (Trực tiếp hoặc Bưu điện)</option>
                        <option value="direct">Chỉ nhận trực tiếp tại vườn</option>
                        <option value="post">Gửi bưu điện COD toàn quốc</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                        Số điện thoại / Zalo liên hệ *
                      </label>
                      <input
                        type="text"
                        required
                        value={seedPhone}
                        onChange={e => setSeedPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                        Địa chỉ / Khu vực phân phát
                      </label>
                      <input
                        type="text"
                        value={seedLocation}
                        onChange={e => setSeedLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Content Textarea */}
              <div>
                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    postCategory === 'qa'
                      ? 'Mô tả rõ triệu chứng (lá bị đốm, đọt quăn, rễ úng...), thời gian bị, loại phân/thuốc đã dùng để mọi người chẩn đoán chuẩn xác...'
                      : postCategory === 'seed_exchange'
                      ? 'Nêu rõ nguồn gốc hạt giống, tỷ lệ nảy mầm, cách thức đăng ký hoặc nhận qua bưu điện...'
                      : 'Chia sẻ các bước kinh nghiệm, tỷ lệ pha chế, thời điểm bón phân hoặc kinh nghiệm thực chiến của bạn...'
                  }
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
                />
              </div>

              {/* Photos Attachment */}
              <div className="space-y-2">
                <label className="font-bold block text-zinc-800 dark:text-zinc-200">
                  Đính kèm hình ảnh cây trồng / hạt giống
                </label>

                {/* Attached image preview chips */}
                {postImageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 py-1">
                    {postImageUrls.map((url, i) => (
                      <div key={i} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPostImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Dán link ảnh https://..."
                    value={imageInput}
                    onChange={e => setImageInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageInput.trim()) {
                        setPostImageUrls(prev => [...prev, imageInput.trim()]);
                        setImageInput('');
                      }
                    }}
                    className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl font-bold text-xs"
                  >
                    Thêm link
                  </button>

                  <label className="px-3 py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl cursor-pointer hover:bg-emerald-200 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Tải ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Sample quick photos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-zinc-500">
                  <span>Ảnh mẫu nhanh:</span>
                  {SAMPLE_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPostImageUrls(prev => [...prev, sample.url])}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-950"
                    >
                      + {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                  Thẻ chủ đề (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={e => setPostTags(e.target.value)}
                  placeholder="Ví dụ: HỏiĐáp, CàChua, TrịSâuRầy, HữuCơ"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 shadow-xs"
                >
                  Đăng Bài Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEED CLAIM SUCCESS NOTIFICATION MODAL */}
      {claimedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-teal-200 dark:border-teal-800 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
              <Gift className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
                Đăng Ký Nhận Hạt Thành Công!
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Bạn đã đăng ký 1 phần hạt giống: <strong>{claimedNotice.title}</strong>
              </p>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs space-y-1 text-left">
              <span className="text-[11px] text-zinc-500 font-medium block">
                Vui lòng nhắn tin qua Zalo hoặc gọi người tặng để chốt địa chỉ nhận:
              </span>
              <div className="flex items-center justify-between font-bold text-teal-700 dark:text-teal-400 text-sm">
                <span>{claimedNotice.phone}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(claimedNotice.phone);
                    alert('Đã sao chép số điện thoại người tặng hạt!');
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-600"
                  title="Sao chép số"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setClaimedNotice(null)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs"
            >
              Đã hiểu, cảm ơn!
            </button>
          </div>
        </div>
      )}

      {/* FULL-IMAGE LIGHTBOX MODAL */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-zinc-300 p-2 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt="Phóng to ảnh"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
