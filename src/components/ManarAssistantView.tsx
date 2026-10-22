import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  AlertTriangle,
  Volume2,
  VolumeX,
  RotateCcw,
  ShieldCheck,
  Bot,
  User,
  HeartPulse,
  Info,
} from "lucide-react";
import { ManarMessage } from "../types";

export const ManarAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<ManarMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "يا هلا فيك! أنا طبيبتك منار، مساعدتك المعرفية والبحثية لمنظومة «عين المستشفى».\n\nيسعدني مساعدتك في شرح الفحوصات والتحاليل الطبية، إرشادات تشغيل وسلامة الأجهزة، وتوضيح المصطلحات السريرية للكوادر والمراجعين.\n\nكيف أقدر أخدمك اليوم؟",
      timestamp: new Date().toISOString(),
      meta: {
        confidence: "مساعد معتمد لمنظومة عين المستشفى",
        disclaimer: "طبيبتك منار شخصية اصطناعية تثقيفية ولا تغني عن استشارة الطبيب المختص.",
      },
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const samplePrompts = [
    "ما هو فحص Troponin ودلالته في الطوارئ؟",
    "احتياطات السلامة عند تشغيل جهاز الأشعة المتنقل MX-200",
    "ما المعدل الطبيعي لضغط الدم والنبض للكبار؟",
    "خطوات التعامل مع انخفاض ضغط الأكسجين المركزي",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ar-SA";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    setInput("");
    setEmergencyAlert(null);

    const userMsg: ManarMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/manar/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.emergency) {
        setEmergencyAlert(data.answer);
      }

      const botMsg: ManarMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: data.answer || "عذراً، حدث خطأ في معالجة الإجابة.",
        timestamp: new Date().toISOString(),
        meta: {
          confidence: data.confidence,
          disclaimer: data.disclaimer,
          emergency: data.emergency,
        },
      };

      setMessages((prev) => [...prev, botMsg]);
      if (data.answer) {
        speakText(data.answer);
      }
    } catch (err) {
      const errorMsg: ManarMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "تعذر الاتصال بالخادم في هذه اللحظة. يرجى المحاولة مرة أخرى بعد قليل.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: "أهلاً بك مجدداً! جاهزة للإجابة عن أي استفسار طبي أو تشغيلي في المستشفى.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setEmergencyAlert(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Top Profile Card */}
      <div className="bg-gradient-to-r from-[#193B3A] via-[#126B68] to-[#193B3A] text-white p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-right">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/10 p-1 border-2 border-[#F4C96B] shadow-md overflow-hidden shrink-0">
              <img
                src="/assets/images/manar/reassuring.png"
                alt="طبيبتك منار"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#193B3A]" title="متصل الآن"></span>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl font-black text-white">طبيبتك منار</h2>
              <span className="bg-[#F4C96B] text-[#193B3A] text-[10px] font-black px-2 py-0.5 rounded-md">
                ذكاء اصطناعي طبي
              </span>
            </div>
            <p className="text-xs text-[#D6E5E1] mt-1 leading-relaxed">
              المساعدة المعرفية والبحثية المعتمدة لمنظومة عين المستشفى • مراجع سريرية وإرشادية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              speechEnabled
                ? "bg-[#F4C96B] text-[#193B3A]"
                : "bg-white/10 hover:bg-white/20 text-[#D6E5E1]"
            }`}
            title="القراءة الصوتية التلقائية"
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{speechEnabled ? "الصوت مفعل" : "تفعيل الصوت"}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#D6E5E1] text-xs font-bold flex items-center gap-1"
            title="بدء محادثة جديدة"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      {emergencyAlert && (
        <div className="bg-[#FBE6DE] border-2 border-[#C9684D] text-[#8C2E17] p-4 rounded-2xl flex items-start gap-3 shadow-md animate-bounce">
          <AlertTriangle className="w-6 h-6 text-[#C9684D] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-[#8C2E17]">تنبيه حالة طارئة حرجة</h4>
            <p className="text-xs font-bold leading-relaxed">{emergencyAlert}</p>
            <div className="pt-2">
              <a
                href="tel:997"
                className="inline-block bg-[#C9684D] text-white text-xs font-black px-4 py-1.5 rounded-xl hover:bg-[#b0533a]"
              >
                الاتصال بهيئة الهلال الأحمر (997) فوراً
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="bg-white rounded-3xl border border-[#E1EBE8] p-5 shadow-xs min-h-[420px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser ? "bg-[#193B3A] text-white" : "bg-[#E9F5F2] text-[#126B68]"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 leading-relaxed ${
                    isUser
                      ? "bg-[#193B3A] text-white rounded-tr-xs"
                      : "bg-[#F6FAF8] text-[#193B3A] border border-[#E1EBE8] rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.meta?.disclaimer && (
                    <div className="pt-2 border-t border-[#DCE8E5] text-[10px] text-[#738884] flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#126B68] shrink-0" />
                      <span>{msg.meta.disclaimer}</span>
                    </div>
                  )}

                  <div className="text-[9px] text-right opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E9F5F2] text-[#126B68] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#F6FAF8] border border-[#E1EBE8] rounded-2xl p-3.5 rounded-tl-xs flex items-center gap-2 text-xs text-[#6B8581]">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#126B68] animate-ping"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#126B68] animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#126B68] animate-pulse"></span>
                </div>
                <span>طبيبتك منار تبحث وتصيغ الإجابة الطبية...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length <= 2 && (
          <div className="space-y-1.5 pt-3 border-t border-[#EEF3F1]">
            <span className="text-[11px] font-bold text-[#738884] block">أسئلة شائعة يمكنك النقر عليها:</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="text-[11px] font-medium bg-[#F0F5F3] hover:bg-[#E1EBE8] text-[#193B3A] px-3 py-1.5 rounded-xl border border-[#DCE8E5] transition-all text-right"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="pt-2 border-t border-[#EEF3F1]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب استفسارك الطبي أو الفني لطبيبتك منار..."
              className="flex-1 bg-[#F6FAF8] border border-[#DCE8E5] rounded-2xl px-4 py-3 text-xs text-[#193B3A] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68] focus:ring-2 focus:ring-[#126B68]/15"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-xs"
            >
              <span>إرسال</span>
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-[#8B9A97]">
            <span>مساعد افتراضي مدعوم بالذكاء الاصطناعي السريري</span>
            <span>في الحالات الطارئة: 997</span>
          </div>
        </div>
      </div>
    </div>
  );
};
