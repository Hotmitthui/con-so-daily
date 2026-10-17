import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function useInventory(ngaySo: string, ordersTable: string, imageSource: 'r2' | 'supa') {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [ticketImage, setTicketImage] = useState<string | null>(null);
  const [ticketImageFallback, setTicketImageFallback] = useState<string | null>(null);
  const [maxRows, setMaxRows] = useState<number>(5);
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [veDienTuMap, setVeDienTuMap] = useState<Record<string, { qty?: number; tail?: string }>>({});
  const [veMauUrl, setVeMauUrl] = useState<string | null>(null);

  const fetchData = async () => {
    if (!supabase || !ngaySo) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data: ticketData } = await supabase
        .from("ve_truyen_thong")
        .select('chi_tiet_ve, anh_ve_url, anh_ve_r2_url, so_hang, trang_thai_khoa, ve_dien_tu, ve_mau_r2_url')
        .eq('ngay_so', ngaySo)
        .single();

      const initialStock: Record<string, number> = ticketData?.chi_tiet_ve || {};
      const r2Url = ticketData?.anh_ve_r2_url || null;
      const supaUrl = ticketData?.anh_ve_url || null;

      const imageUrl = imageSource === 'r2' ? (r2Url || supaUrl) : (supaUrl || r2Url);
      const imageFallback = imageSource === 'r2'
        ? (supaUrl && supaUrl !== imageUrl ? supaUrl : null)
        : (r2Url && r2Url !== imageUrl ? r2Url : null);

      setTicketImage(imageUrl);
      setTicketImageFallback(imageFallback);
      setMaxRows(ticketData?.so_hang || 5);
      setIsSystemLocked(ticketData?.trang_thai_khoa || false);

      const veDienTuData = ticketData?.ve_dien_tu;
      if (veDienTuData && typeof veDienTuData === 'object') {
        setVeDienTuMap(veDienTuData as Record<string, { qty?: number; tail?: string }>);
      } else {
        setVeDienTuMap({});
      }
      setVeMauUrl(ticketData?.ve_mau_r2_url || null);

      const { data: orders } = await supabase
        .from(ordersTable)
        .select('danh_sach_so')
        .eq('ngay_so', ngaySo);

      const soldStock: Record<string, number> = {};
      if (orders) {
        orders.forEach((order: any) => {
          const items = order.danh_sach_so;
          if (items) {
            Object.entries(items).forEach(([num, qty]) => {
              soldStock[num] = (soldStock[num] || 0) + Number(qty);
            });
          }
        });
      }

      const realStock: Record<string, number> = {};
      Object.keys(initialStock).forEach(num => {
        realStock[num] = Math.max(0, (initialStock[num] || 0) - (soldStock[num] || 0));
      });
      setInventory(realStock);

    } catch (error) {
      console.error("Lỗi khi lấy tồn kho:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ngaySo, ordersTable, imageSource]);

  return {
    inventory,
    ticketImage,
    ticketImageFallback,
    maxRows,
    isSystemLocked,
    loading,
    veDienTuMap,
    veMauUrl,
    setInventory,
    setIsSystemLocked,
    setTicketImage,
    setTicketImageFallback,
    setVeDienTuMap,
    setVeMauUrl,
    fetchData,
  };
}