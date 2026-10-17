"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Chuyển đổi văn bản tiếng Việt chứa số hoặc từ đọc số sang chuỗi các chữ số (0-9)
 * - Hỗ trợ đọc từng chữ số lẻ: "bốn hai hai hai năm sáu" -> "422256"
 * - Hỗ trợ đọc lặp từ: "bốn ba số hai năm sáu" -> "422256" hoặc "bốn ba con hai năm sáu" -> "422256"
 * - Hỗ trợ từ ghép hàng chục: "hai mươi hai" -> "22"
 */
export const parseSpeechToDigits = (text: string): string => {
  if (!text) return "";

  // Chuẩn hóa: khoảng trắng ở đầu và cuối để dễ dàng bắt từ (tương thích 100% Safari, Chrome, iOS)
  let converted = " " + text.toLowerCase().replace(/[,.;:!?\-]/g, " ") + " ";

  // 1. Cặp từ lặp: "đôi 4", "cặp bốn", "hai số bốn", "ba con hai"
  const repeatCounts = [
    { word: "đôi", count: 2 },
    { word: "doi", count: 2 },
    { word: "cặp", count: 2 },
    { word: "cap", count: 2 },
  ];

  const digitWords = [
    { word: "không", val: "0" }, { word: "khong", val: "0" }, { word: "zero", val: "0" }, { word: "0", val: "0" },
    { word: "một", val: "1" }, { word: "mot", val: "1" }, { word: "mốt", val: "1" }, { word: "1", val: "1" },
    { word: "hai", val: "2" }, { word: "2", val: "2" },
    { word: "ba", val: "3" }, { word: "3", val: "3" },
    { word: "bốn", val: "4" }, { word: "bon", val: "4" }, { word: "tư", val: "4" }, { word: "4", val: "4" },
    { word: "năm", val: "5" }, { word: "nam", val: "5" }, { word: "lăm", val: "5" }, { word: "5", val: "5" },
    { word: "sáu", val: "6" }, { word: "sau", val: "6" }, { word: "6", val: "6" },
    { word: "bảy", val: "7" }, { word: "bay", val: "7" }, { word: "7", val: "7" },
    { word: "tám", val: "8" }, { word: "tam", val: "8" }, { word: "8", val: "8" },
    { word: "chín", val: "9" }, { word: "chin", val: "9" }, { word: "9", val: "9" },
  ];

  // "đôi bốn", "cặp tư", "đôi 4", "cặp 9"
  for (const r of repeatCounts) {
    for (const d of digitWords) {
      const pattern = new RegExp("(^|\\s)" + r.word + "\\s+(?:số\\s+|con\\s+)?" + d.word + "(\\s|$)", "gi");
      converted = converted.replace(pattern, "$1" + d.val.repeat(r.count) + "$2");
    }
  }

  // "hai số bốn", "ba con hai", "bốn số năm"
  const multiCounts = [
    { word: "hai", count: 2 }, { word: "2", count: 2 },
    { word: "ba", count: 3 }, { word: "3", count: 3 },
    { word: "bốn", count: 4 }, { word: "bon", count: 4 }, { word: "4", count: 4 },
    { word: "năm", count: 5 }, { word: "nam", count: 5 }, { word: "5", count: 5 },
    { word: "sáu", count: 6 }, { word: "sau", count: 6 }, { word: "6", count: 6 },
  ];
  for (const m of multiCounts) {
    for (const d of digitWords) {
      const pattern = new RegExp("(^|\\s)" + m.word + "\\s+(?:số|con)\\s+" + d.word + "(\\s|$)", "gi");
      converted = converted.replace(pattern, "$1" + d.val.repeat(m.count) + "$2");
    }
  }

  // 2. Các số hàng chục từ 10 đến 99: "bốn mươi tư" -> 44, "chín mươi chín" -> 99
  const tens = [
    { word: "hai mươi", val: "2" },
    { word: "ba mươi", val: "3" },
    { word: "bốn mươi", val: "4" },
    { word: "năm mươi", val: "5" },
    { word: "sáu mươi", val: "6" },
    { word: "bảy mươi", val: "7" },
    { word: "tám mươi", val: "8" },
    { word: "chín mươi", val: "9" },
    { word: "mười", val: "1" },
  ];

  const units = [
    { word: "mốt", val: "1" },
    { word: "một", val: "1" },
    { word: "hai", val: "2" },
    { word: "ba", val: "3" },
    { word: "bốn", val: "4" },
    { word: "tư", val: "4" },
    { word: "lăm", val: "5" },
    { word: "năm", val: "5" },
    { word: "sáu", val: "6" },
    { word: "bảy", val: "7" },
    { word: "tám", val: "8" },
    { word: "chín", val: "9" },
  ];

  for (const t of tens) {
    for (const u of units) {
      const p = new RegExp("(^|\\s)" + t.word + "\\s+" + u.word + "(\\s|$)", "gi");
      converted = converted.replace(p, "$1" + t.val + u.val + "$2");
    }
    const pRound = new RegExp("(^|\\s)" + t.word + "(\\s|$)", "gi");
    converted = converted.replace(pRound, "$1" + t.val + "0$2");
  }

  // "hai chục", "bốn chục", v.v.
  const chuc = [
    { word: "một chục", val: "10" },
    { word: "hai chục", val: "20" },
    { word: "ba chục", val: "30" },
    { word: "bốn chục", val: "40" },
    { word: "năm chục", val: "50" },
    { word: "sáu chục", val: "60" },
    { word: "bảy chục", val: "70" },
    { word: "tám chục", val: "80" },
    { word: "chín chục", val: "90" },
  ];
  for (const c of chuc) {
    const p = new RegExp("(^|\\s)" + c.word + "(\\s|$)", "gi");
    converted = converted.replace(p, "$1" + c.val + "$2");
  }

  // 3. Đọc tắt hàng chục kiểu "bốn tư" -> 44, "tư tư" -> 44, "chín tư" -> 94
  const tat = [
    { word: "bốn\\s+tư", val: "44" },
    { word: "tư\\s+tư", val: "44" },
    { word: "chín\\s+tư", val: "94" },
    { word: "hai\\s+tư", val: "24" },
    { word: "ba\\s+tư", val: "34" },
    { word: "năm\\s+tư", val: "54" },
    { word: "sáu\\s+tư", val: "64" },
    { word: "bảy\\s+tư", val: "74" },
    { word: "tám\\s+tư", val: "84" },
    { word: "hai\\s+mốt", val: "21" },
    { word: "ba\\s+mốt", val: "31" },
    { word: "bốn\\s+mốt", val: "41" },
    { word: "năm\\s+mốt", val: "51" },
    { word: "sáu\\s+mốt", val: "61" },
    { word: "bảy\\s+mốt", val: "71" },
    { word: "tám\\s+mốt", val: "81" },
    { word: "chín\\s+mốt", val: "91" },
    { word: "hai\\s+lăm", val: "25" },
    { word: "ba\\s+lăm", val: "35" },
    { word: "bốn\\s+lăm", val: "45" },
    { word: "năm\\s+lăm", val: "55" },
    { word: "sáu\\s+lăm", val: "65" },
    { word: "bảy\\s+lăm", val: "75" },
    { word: "tám\\s+lăm", val: "85" },
    { word: "chín\\s+lăm", val: "95" },
  ];
  for (const item of tat) {
    const p = new RegExp("(^|\\s)" + item.word + "(\\s|$)", "gi");
    converted = converted.replace(p, "$1" + item.val + "$2");
  }

  // 4. Thay thế từng chữ số lẻ (chạy lặp để xử lý các từ liền nhau như "chín chín", "hai hai")
  const single = [
    { word: "không", val: "0" }, { word: "khong", val: "0" }, { word: "zero", val: "0" },
    { word: "một", val: "1" }, { word: "mot", val: "1" }, { word: "mốt", val: "1" },
    { word: "hai", val: "2" },
    { word: "ba", val: "3" },
    { word: "bốn", val: "4" }, { word: "bon", val: "4" }, { word: "tư", val: "4" },
    { word: "năm", val: "5" }, { word: "nam", val: "5" }, { word: "lăm", val: "5" },
    { word: "sáu", val: "6" }, { word: "sau", val: "6" },
    { word: "bảy", val: "7" }, { word: "bay", val: "7" },
    { word: "tám", val: "8" }, { word: "tam", val: "8" },
    { word: "chín", val: "9" }, { word: "chin", val: "9" },
  ];

  for (const s of single) {
    const p = new RegExp("(^|\\s)" + s.word + "(\\s|$)", "gi");
    let prev = converted;
    let next = prev.replace(p, "$1" + s.val + "$2");
    while (next !== prev) {
      prev = next;
      next = prev.replace(p, "$1" + s.val + "$2");
    }
    converted = next;
  }

  return converted.replace(/[^0-9]/g, "");
};

interface SpeechToNumberOptions {
  lang?: string;
  onDigitsRecognized?: (digits: string, fullTranscript: string) => void;
}

export function useSpeechToNumber(options: SpeechToNumberOptions = {}) {
  const { lang = "vi-VN", onDigitsRecognized } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [digits, setDigits] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accumulatedTextRef = useRef<string>("");
  const currentSessionTextRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(false);
  const onDigitsRef = useRef(onDigitsRecognized);
  const restartTimerRef = useRef<any>(null);

  useEffect(() => {
    onDigitsRef.current = onDigitsRecognized;
  }, [onDigitsRecognized]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    accumulatedTextRef.current = "";
    currentSessionTextRef.current = "";
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript("");
    setDigits("");
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Trình duyệt không hỗ trợ nhận diện giọng nói (Web Speech API).");
      return;
    }

    shouldKeepListeningRef.current = true;
    accumulatedTextRef.current = "";
    currentSessionTextRef.current = "";
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }

    const initRecognition = () => {
      if (!shouldKeepListeningRef.current) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let sessionText = "";
          for (let i = 0; i < event.results.length; i++) {
            sessionText += (event.results[i][0]?.transcript || "") + " ";
          }
          currentSessionTextRef.current = sessionText.trim();

          const combined = `${accumulatedTextRef.current} ${currentSessionTextRef.current}`.trim();
          setTranscript(combined);

          const extractedDigits = parseSpeechToDigits(combined);
          setDigits(extractedDigits);

          if (onDigitsRef.current) {
            onDigitsRef.current(extractedDigits, combined);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === "no-speech" || event.error === "aborted") {
            return;
          }
          console.warn("Speech Recognition Error:", event.error);
        };

        recognition.onend = () => {
          // Lưu lại văn bản session vừa kết thúc vào biến tích lũy để không mất khi người dùng đọc chậm
          if (currentSessionTextRef.current) {
            accumulatedTextRef.current = `${accumulatedTextRef.current} ${currentSessionTextRef.current}`.trim();
            currentSessionTextRef.current = "";
          }

          if (shouldKeepListeningRef.current) {
            // QUAN TRỌNG: Chrome Web Speech API bắt buộc phải có một khoảng trễ nhỏ (150ms)
            // trước khi khởi động lại session mới để giải phóng stream audio. Nếu gọi start()
            // ngay lập tức thì Chrome sẽ ném lỗi "recognition has already started" và ngắt micro!
            if (restartTimerRef.current) {
              clearTimeout(restartTimerRef.current);
            }
            restartTimerRef.current = setTimeout(() => {
              if (shouldKeepListeningRef.current) {
                initRecognition();
              }
            }, 150);
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.warn("Error starting speech recognition:", err);
        // Nếu bị lỗi start (do chưa nhả stream), thử lại sau 200ms thay vì ngắt hẳn
        if (shouldKeepListeningRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              initRecognition();
            }
          }, 200);
        }
      }
    };

    initRecognition();
  }, [lang]);

  const resetTranscript = useCallback(() => {
    accumulatedTextRef.current = "";
    currentSessionTextRef.current = "";
    setTranscript("");
    setDigits("");
    setError(null);
    if (shouldKeepListeningRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
  }, []);

  return {
    isListening,
    transcript,
    digits,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
