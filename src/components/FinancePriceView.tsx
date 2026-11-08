import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COMMODITY_PRICES } from '../data/mockData';
import { CommodityPriceItem, FarmTransaction } from '../types';
import {
  BadgeDollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const FinancePriceView: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, t } = useApp();
  const [activeTab, setActiveTab] = useState<'finance' | 'market_prices' | 'yield_calc'>('finance');
  const [showAddTxModal, setShowAddTxModal] = useState<boolean>(false);

  // New Transaction Form state
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState<FarmTransaction['category']>('fertilizer');
  const [txAmount, setTxAmount] = useState<number>(500000);
  const [txCropName, setTxCropName] = useState<string>('Vườn sầu riêng Ri6');
  const [txDescription, setTxDescription] = useState<string>('');

  // Season Yield Calculator state
  const [cropType, setCropType] = useState('saurieng');
  const [acreage, setAcreage] = useState<number>(5); // 5 sào / 5000 m2
  const [treesCount, setTreesCount] = useState<number>(100);

  // Financial calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      type: txType,
      category: txCategory,
      amount: Number(txAmount),
      cropName: txCropName,
      description: txDescription || (txType === 'income' ? 'Bán nông sản' : 'Chi phí vật tư')
    });
    setShowAddTxModal(false);
    setTxDescription('');
  };

  const handleExportCSV = () => {
    const headers = ['Mã Giao Dịch,Ngày,Loại,Hạng Mục,Cây Trồng,Mô Tả,Số Tiền (VND)'];
    const rows = transactions.map(t =>
      `"${t.id}","${t.date}","${t.type === 'income' ? 'Thu nhập' : 'Chi phí'}","${t.category}","${t.cropName}","${t.description.replace(/"/g, '""')}","${t.amount}"`
    );
    const summary = [
      '',
      `"Tổng Thu Nhập:","${totalIncome}"`,
      `"Tổng Chi Phí:","${totalExpense}"`,
      `"Lợi Nhuận Thuần:","${netProfit}"`
    ];

    const csvContent = '\uFEFF' + [headers, ...rows, ...summary].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Tai_Chinh_Nong_Nghiep_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Yield Calculator logic
  const calculateYield = () => {
    if (cropType === 'saurieng') {
      const avgKgPerTree = 80;
      const totalKg = treesCount * avgKgPerTree;
      const expectedRevenue = totalKg * 85000;
      const estCost = treesCount * 650000;
      return { totalKg, expectedRevenue, estCost, profit: expectedRevenue - estCost, unit: 'kg' };
    } else if (cropType === 'lua') {
      const totalKg = acreage * 750; // 750kg / sào
      const expectedRevenue = totalKg * 8200;
      const estCost = acreage * 2200000;
      return { totalKg, expectedRevenue, estCost, profit: expectedRevenue - estCost, unit: 'kg' };
    } else {
      const totalKg = acreage * 1200;
      const expectedRevenue = totalKg * 25000;
      const estCost = acreage * 9000000;
      return { totalKg, expectedRevenue, estCost, profit: expectedRevenue - estCost, unit: 'kg' };
    }
  };

  const yieldData = calculateYield();

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BadgeDollarSign className="w-7 h-7 text-emerald-600" />
            <span>Quản Lý Chi Phí Canh Tác & Giá Nông Sản</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Theo dõi dòng tiền, xuất báo cáo tài chính hàng tháng và dự báo giá nông sản thị trường
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'finance'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Sổ Thu Chi Canh Tác
          </button>
          <button
            onClick={() => setActiveTab('market_prices')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'market_prices'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Giá Nông Sản Hôm Nay
          </button>
          <button
            onClick={() => setActiveTab('yield_calc')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'yield_calc'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Ước Tính Năng Suất & Lãi
          </button>
        </div>
      </div>

      {/* VIEW 1: SỔ THU CHI & BÁO CÁO TÀI CHÍNH */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
              <span className="text-xs text-zinc-500 font-semibold">{t('totalIncome')}</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{totalIncome.toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[11px] text-zinc-400">Từ bán sầu riêng, rau củ quả</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
              <span className="text-xs text-zinc-500 font-semibold">{t('totalExpense')}</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                -{totalExpense.toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[11px] text-zinc-400">Phân bón, giống, nhân công</span>
            </div>

            <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 p-5 rounded-2xl text-white shadow-md shadow-emerald-700/20 space-y-1">
              <span className="text-xs opacity-90 font-semibold">{t('netProfit')}</span>
              <div className="text-2xl font-black">
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[11px] opacity-90">Tỷ suất sinh lời: ~{totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0}%</span>
            </div>
          </div>

          {/* Action Bar: Add transaction & Export CSV */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Nhật Ký Giao Dịch Canh Tác Hàng Tháng</span>
            </h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportCSV}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>{t('exportReport')}</span>
              </button>

              <button
                onClick={() => setShowAddTxModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addTransaction')}</span>
              </button>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        tx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        {tx.description}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {tx.cropName} • {tx.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`font-black text-sm sm:text-base ${
                          tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} đ
                      </div>
                      <span className="text-[10px] text-zinc-400 capitalize">{tx.category}</span>
                    </div>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa khoản này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GIÁ NÔNG SẢN THỊ TRƯỜNG & DỰ BÁO */}
      {activeTab === 'market_prices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMODITY_PRICES.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">{item.region}</span>
                    <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-500">{item.variety}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                      {item.currentPrice.toLocaleString('vi-VN')} {item.unit}
                    </div>
                    <div
                      className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                        item.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {item.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{item.changePercent >= 0 ? '+' : ''}{item.changePercent}%</span>
                    </div>
                  </div>
                </div>

                {/* 6-day trend visualization */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-bold text-zinc-500 mb-2">Biến động giá 6 ngày gần nhất:</div>
                  <div className="flex items-end justify-between h-14 pt-2">
                    {item.history.map((h, i) => {
                      const min = Math.min(...item.history.map(x => x.price));
                      const max = Math.max(...item.history.map(x => x.price));
                      const percent = Math.max(20, Math.min(100, ((h.price - min) / (max - min || 1)) * 100));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            style={{ height: `${percent}%` }}
                            className="w-full max-w-[16px] rounded-t-sm bg-emerald-500 dark:bg-emerald-400"
                          />
                          <span className="text-[9px] text-zinc-400">{h.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Advice Box */}
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Phân tích thị trường & khuyến nghị thu hoạch:</strong> {item.marketAnalysis}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: TÍNH NĂNG SUẤT & DỰ BÁO LÃI VỤ MÙA */}
      {activeTab === 'yield_calc' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                Mô Phỏng Năng Suất & Dự Báo Doanh Thu Mùa Vụ
              </h3>
              <p className="text-xs text-zinc-500">
                Tính toán sản lượng dự kiến và chi phí đầu vào để lên kế hoạch thu hoạch đạt giá cao nhất
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                Loại cây trồng canh tác
              </label>
              <select
                value={cropType}
                onChange={e => setCropType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold"
              >
                <option value="saurieng">Sầu Riêng Ri6 / Monthong</option>
                <option value="lua">Lúa Gạo OM 5451</option>
                <option value="rausach">Rau Ăn Lá Nhà Lưới</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                Quy mô diện tích (Sào - 1000m²)
              </label>
              <input
                type="number"
                value={acreage}
                onChange={e => setAcreage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold"
              />
            </div>

            {cropType === 'saurieng' && (
              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Số lượng gốc cây đang cho trái
                </label>
                <input
                  type="number"
                  value={treesCount}
                  onChange={e => setTreesCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold"
                />
              </div>
            )}
          </div>

          {/* Results Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-center space-y-1">
              <span className="text-xs text-zinc-500">Sản lượng dự kiến thu hoạch</span>
              <div className="text-xl font-extrabold text-emerald-600">
                {yieldData.totalKg.toLocaleString('vi-VN')} {yieldData.unit}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-center space-y-1">
              <span className="text-xs text-zinc-500">Chi phí đầu tư ước tính</span>
              <div className="text-xl font-extrabold text-rose-500">
                {yieldData.estCost.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Lợi nhuận ròng dự phóng</span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                +{yieldData.profit.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD TRANSACTION MODAL */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Ghi Chép Thu / Chi Canh Tác
              </h3>
              <button onClick={() => setShowAddTxModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleAddTx} className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
                    txType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  Khoản Chi Ra (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
                    txType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  Khoản Thu Vào (+)
                </button>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Số tiền (VNĐ)
                </label>
                <input
                  type="number"
                  required
                  value={txAmount}
                  onChange={e => setTxAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Hạng mục
                </label>
                <select
                  value={txCategory}
                  onChange={e => setTxCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="fertilizer">Phân bón hữu cơ / vô cơ</option>
                  <option value="pesticide">Thuốc BVTV sinh học</option>
                  <option value="seeds">Cây giống & Hạt giống</option>
                  <option value="labor">Thuê nhân công & máy móc</option>
                  <option value="irrigation">Hệ thống tưới & điện nước</option>
                  <option value="harvest_sale">Bán nông sản thu hoạch</option>
                  <option value="other">Khoản mục khác</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Vườn / Cây trồng áp dụng
                </label>
                <input
                  type="text"
                  required
                  value={txCropName}
                  onChange={e => setTxCropName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Mô tả chi tiết
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mua 10 bao phân trùn quế bón đón lộc..."
                  value={txDescription}
                  onChange={e => setTxDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
