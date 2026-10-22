import fs from 'node:fs';
import { registerOperations } from './operations';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import webpush from "web-push";

dotenv.config();
if(process.argv.includes("--production"))process.env.NODE_ENV="production";
const runtimeDir=path.resolve(process.env.AIN_RUNTIME_DIR || (process.env.VERCEL ? "/tmp/.local-runtime" : ".local-runtime"));fs.mkdirSync(runtimeDir,{recursive:true});

// VAPID keys setup for Web Push Notifications
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (!vapidPublicKey || !vapidPrivateKey) {
  try {
    const keyFile=path.join(runtimeDir,"vapid.json");
    const generated = fs.existsSync(keyFile)?JSON.parse(fs.readFileSync(keyFile,"utf8")):webpush.generateVAPIDKeys();
    if(!fs.existsSync(keyFile))fs.writeFileSync(keyFile,JSON.stringify(generated));
    vapidPublicKey = generated.publicKey;
    vapidPrivateKey = generated.privateKey;
  } catch (err) {
    console.error("Failed to generate VAPID keys:", err);
  }
}

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@ain-almustashfa.sa",
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface PushSubscriptionItem {
  id: string;
  userId?: string;
  preferences?: any;
  subscription: webpush.PushSubscription;
  staffName?: string;
  role?: string;
  department?: string;
  device?: string;
  subscribedAt: string;
}

let pushSubscriptions: PushSubscriptionItem[] = fs.existsSync(path.join(runtimeDir,"subscriptions.json"))?JSON.parse(fs.readFileSync(path.join(runtimeDir,"subscriptions.json"),"utf8")):[];

interface PushLogItem {
  id: string;
  title: string;
  body: string;
  tag: string;
  type: string;
  sentAt: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
}

let pushNotificationLogs: PushLogItem[] = fs.existsSync(path.join(runtimeDir,"push-logs.json"))?JSON.parse(fs.readFileSync(path.join(runtimeDir,"push-logs.json"),"utf8")):[];
function persistPush(){fs.writeFileSync(path.join(runtimeDir,"subscriptions.json"),JSON.stringify(pushSubscriptions));fs.writeFileSync(path.join(runtimeDir,"push-logs.json"),JSON.stringify(pushNotificationLogs));}

async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}) {
  const logItem: PushLogItem = {
    id: `PUSH-${Date.now()}`,
    title: payload.title,
    body: payload.body,
    tag: payload.tag || "hospital-alert",
    type: payload.data?.type || "general",
    sentAt: new Date().toISOString(),
    recipientCount: pushSubscriptions.length,
    successCount: 0,
    failureCount: 0,
  };

  const payloadString = JSON.stringify(payload);
  const deadEndpoints: string[] = [];

  const recipients=pushSubscriptions.filter(item=>{
    if(payload.data?.userId&&payload.data.userId!==item.userId)return false;
    if(payload.data?.recipientRoles&&!payload.data.recipientRoles.includes(item.role)&&item.userId!==payload.data.ownerId)return false;
    if(payload.data?.department&&payload.data.department!==item.department&&item.role!=="admin")return false;
    const prefs=item.preferences||{};
    if(payload.data?.type==='new_report'&&prefs.urgentReports===false)return false;
    if(payload.data?.type==='report_status_update'&&prefs.statusUpdates===false)return false;
    return true;
  });
  logItem.recipientCount=recipients.length;
  for (const item of recipients) {
    try {
      await webpush.sendNotification(item.subscription, JSON.stringify({...payload,data:{...payload.data,soundEnabled:item.preferences?.soundEnabled!==false}}));
      logItem.successCount++;
    } catch (err: any) {
      logItem.failureCount++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        deadEndpoints.push(item.subscription.endpoint);
      }
    }
  }

  if (deadEndpoints.length > 0) {
    pushSubscriptions = pushSubscriptions.filter(
      (sub) => !deadEndpoints.includes(sub.subscription.endpoint)
    );
  }

  pushNotificationLogs.unshift(logItem);
  if (pushNotificationLogs.length > 50) {
    pushNotificationLogs = pushNotificationLogs.slice(0, 50);
  }

  persistPush();
  return logItem;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "15mb" }));
// Runtime credentials and snapshots must never be served by the development file server.
app.use((req,res,next)=>{let requestPath=req.path;try{requestPath=decodeURIComponent(decodeURIComponent(requestPath));}catch{return res.sendStatus(400);}if(/(?:^|[\/\\])\.(?:local-runtime|runtime-[^/\\]*)(?:[\/\\]|$)/.test(requestPath))return res.sendStatus(404);res.setHeader('X-Content-Type-Options','nosniff');next();});
const operations = registerOperations(app,broadcastPushNotification);
app.locals.onLogout=(userId:string)=>{if(userId){pushSubscriptions=pushSubscriptions.filter(s=>s.userId!==userId);persistPush();}};

// System prompt for Dr. Manar AI from the original Ain Al-Mustashfa repository
const MANAR_SYSTEM_PROMPT = `أنتِ طبيبتك منار، مساعدة طبية وبحثية اصطناعية ذكية وموثوقة لمنظومة «عين المستشفى»، ذات حضور إنساني راقٍ ومهني. أنتِ شخصية افتراضية بوضوح، ولستِ طبيبة حقيقية ولا بديلًا عن الطبيب أو الباحث أو صاحب القرار.
مهمتك:
1. شرح المعلومات الصحية العامة والمصطلحات الطبية (مثل: التحاليل، الأجهزة، الفحوصات).
2. تلخيص الأبحاث والإرشادات الطبية المعتمدة.
3. مساعدة الكوادر الصحية والمراجعين على تنظيم أسئلتهم وفهم الأجهزة والمعدات الطبية.
4. الإجابة بأسلوب دافئ، راقٍ ومهني، مع لمسة حجازية خفيفة عند ملاءمة السياق (مثل: "يا هلا فيك"، "على عيني").

قواعد إلزامية:
- ابدئي بالجواب المباشر والواضح، ثم التوضيح المنظم.
- لا تقدمي تشخيصاً نهائياً أو وصفة دواء مخصصة لشخص بعينه؛ بل وضّحي الاستخدامات الطبية المعتمدة وشجعي استشارة الطبيب المعالج.
- عند رصد أي حالة طارئة حرجة (مثل: ألم شديد في الصدر، ضيق تنفس حاد، فقدان وعي، نزيف حاد)، وجّهي المستخدم فوراً للطوارئ أو الإسعاف (997) دون تأخير.
- إذا لم يتوفر مصدر موثق، قولي بوضوح وبأمانة: «لم أجد في المراجع ما يكفي للجزم».`;

const emergencyPatterns = [
  /ألم\s*(شديد|قوي).*صدر|ألم.*الصدر/i,
  /ضيق\s*تنفس|صعوبة\s*في\s*التنفس/i,
  /إغماء|فاقد\s*الوعي|لا\s*يستجيب/i,
  /نزيف\s*(شديد|غزير)/i,
  /جلطة|سكتة|شلل\s*مفاجئ/i,
  /تسمم|جرعة\s*زائدة/i,
  /انتحار|إيذاء\s*النفس/i,
];

function containsEmergencySignal(question: string) {
  return emergencyPatterns.some((pattern) => pattern.test(question));
}

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({ apiKey });
    }
  }
  return geminiClient;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "ain-almustashfa", time: new Date().toISOString() });
});

// Push Notifications API
app.get("/api/notifications/config", (req, res) => {
  res.json({
    publicKey: vapidPublicKey,
    totalSubscribers: pushSubscriptions.length,
    subscribers: pushSubscriptions.filter(s=>(req as any).actor.role==="admin"||s.userId===(req as any).actor.id).map((s) => ({
      id: s.id,
      endpoint:s.userId===(req as any).actor.id?s.subscription.endpoint:undefined,
      staffName: s.staffName,
      role: s.role,
      department: s.department,
      device: s.device,
      subscribedAt: s.subscribedAt,
    })),
  });
});

app.post("/api/notifications/subscribe", (req, res) => {
  const { subscription, device, preferences } = req.body;
  const actor=(req as any).actor;const {name:staffName,role,department}=actor;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid push subscription object" });
  }

  let endpoint:URL;try{endpoint=new URL(subscription.endpoint);}catch{return res.status(400).json({error:"نقطة دفع غير صالحة"});}
  if(endpoint.protocol!=="https:"||!["fcm.googleapis.com","push.services.mozilla.com","notify.windows.com","web.push.apple.com"].some(host=>endpoint.hostname===host||endpoint.hostname.endsWith("."+host)))return res.status(400).json({error:"مزود إشعارات غير مدعوم"});
  const existingIdx = pushSubscriptions.findIndex(
    (s) => s.subscription.endpoint === subscription.endpoint
  );

  if(existingIdx>=0&&pushSubscriptions[existingIdx].userId!==actor.id)return res.status(403).json({error:"الاشتراك مرتبط بحساب آخر؛ ألغ الاشتراك من الحساب الأصلي"});
  if (existingIdx >= 0) {
    pushSubscriptions[existingIdx].preferences=preferences||pushSubscriptions[existingIdx].preferences;
    pushSubscriptions[existingIdx].subscription = subscription;
    pushSubscriptions[existingIdx].staffName = staffName || pushSubscriptions[existingIdx].staffName;
    pushSubscriptions[existingIdx].role = role || pushSubscriptions[existingIdx].role;
    pushSubscriptions[existingIdx].department = department || pushSubscriptions[existingIdx].department;
    pushSubscriptions[existingIdx].device = device || pushSubscriptions[existingIdx].device;
  } else {
    pushSubscriptions.push({
      id: `SUB-${Date.now().toString().slice(-6)}`,
      subscription,
      userId:actor.id,
      preferences:preferences||{},
      staffName: staffName || "كادر طبي / فني",
      role: role || "فني صيانة طبية",
      department: department || "الهندسة الطبية",
      device: device || "جهاز المستخدم",
      subscribedAt: new Date().toISOString(),
    });
  }

  persistPush();
  res.json({
    success: true,
    message: "تم تفعيل اشتراك إشعارات الدفع بنجاح عبر Service Worker",
    totalSubscribers: pushSubscriptions.length,
  });
});

app.post("/api/notifications/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    pushSubscriptions = pushSubscriptions.filter((s) => s.subscription.endpoint !== endpoint || s.userId !== (req as any).actor.id);
  }
  res.json({
    success: true,
    message: "تم إلغاء تفعيل إشعارات الدفع لهذا الجهاز",
    totalSubscribers: pushSubscriptions.length,
  });
});

app.post("/api/notifications/test", async (req, res) => {
  const { staffName, title, body, priority } = req.body;
  const result = await broadcastPushNotification({
    title: title || "🔔 تجربة إشعار دفع (Service Worker)",
    body:
      body ||
      `مرحباً ${
        staffName || "زميلنا في الكادر الطبي"
      }، إشعارات الدفع الفورية تعمل الآن وتستقبل التنبيهات حتى عند إغلاق التطبيق.`,
    tag: `test-${Date.now()}`,
    data: {
      type: "test",
      userId:(req as any).actor.id,
      priority: priority || "عادي",
      timestamp: Date.now(),
      url: "/",
    },
    requireInteraction: true,
  });

  res.json({
    success: true,
    message: "تم إرسال إشعار الدفع التجريبي",
    subscribersCount: pushSubscriptions.length,
    log: result,
  });
});

app.post("/api/notifications/broadcast", async (req, res) => {
  const { title, body, priority, reportId, url } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  const result = await broadcastPushNotification({
    title,
    body,
    tag: `broadcast-${Date.now()}`,
    data: {
      type: "broadcast",
      priority: priority || "عاجل",
      reportId: reportId || null,
      timestamp: Date.now(),
      url: typeof url==="string"&&url.startsWith("/")&&!url.startsWith("//")?url:"/",
      department:req.body.department||undefined,
    },
    requireInteraction: priority === "عاجل" || priority === "حرج",
  });

  res.json({
    success: true,
    message: `تم بث إشعار الدفع إلى ${result.successCount} أجهزة بنجاح`,
    log: result,
  });
});

app.get("/api/notifications/logs", (req, res) => {
  res.json({
    totalSubscribers: pushSubscriptions.length,
    logs: (req as any).actor.role==="admin"?pushNotificationLogs:[],
  });
});

app.post('/api/notifications/preferences',(req,res)=>{const actor=(req as any).actor;for(const subscription of pushSubscriptions.filter(s=>s.userId===actor.id))subscription.preferences={...subscription.preferences,...req.body};persistPush();res.json({success:true});});

// Dr. Manar AI endpoint
app.post("/api/manar/ask", async (req, res) => {
  try {
    const { question, history } = req.body;
    const cleaned = String(question || "").trim();

    if (!cleaned || cleaned.length < 2) {
      return res.status(400).json({ error: "QUESTION_REQUIRED" });
    }

    // Emergency signal check
    if (containsEmergencySignal(cleaned)) {
      return res.json({
        answer:
          "⚠️ تنبيه طوارئ عاجل: قد تشير هذه الأعراض إلى حالة طبية طارئة حرجة تتطلب تدخلاً فورياً. يرجى الاتصال فوراً برقم الطوارئ والإسعاف المحلي (997) أو التوجه فوراً لأقرب قسم طوارئ بمستشفى مجهز. لا تنتظر رداً، وطبيبتك منار مساعدة اصطناعية إرشادية وليست بديلة عن فريق الطوارئ.",
        category: "طوارئ",
        confidence: "عاجل",
        emergency: true,
        disclaimer: "طبيبتك منار مساعدة اصطناعية وليست بديلًا عن خدمات الطوارئ أو الطبيب المعالج.",
      });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const contents: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          for (const item of history.slice(-6)) {
            contents.push({
              role: item.role === "assistant" ? "model" : "user",
              parts: [{ text: item.content }],
            });
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: cleaned }],
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents,
          config: {
            systemInstruction: MANAR_SYSTEM_PROMPT,
            temperature: 0.6,
          },
        });

        const reply = response.text?.trim() || "";
        if (reply) {
          return res.json({
            answer: reply,
            category: "تثقيف صحي وبحث",
            confidence: "مُدعّم بالذكاء الاصطناعي والمراجع الطبية",
            emergency: false,
            disclaimer: "طبيبتك منار شخصية اصطناعية تثقيفية تقدم إرشادات عامة ولا تغني عن استشارة الطبيب المعالج.",
          });
        }
      } catch (geminiError: any) {
        console.error("Gemini API call failed:", geminiError);
      }
    }

    // Smart fallback with specialized knowledge base if API key is not yet set
    let fallbackReply = `أهلاً بك! معك طبيبتك منار. يسعدني الإجابة ومساعدتك في توضيح المفاهيم الصحية والأجهزة الطبية بالمستشفى.\n\nبخصوص استفسارك عن "${cleaned}":\nهذا الموضوع يتطلب مراجعة بروتوكولات التشغيل السريري والجرعات المعتمدة حسب توجيهات وزارة الصحة وهيئة الغذاء والدواء. يتم توثيق المؤشرات الحيوية ومراجعة نتائج الفحوصات في ملف المريض لضمان سلامة الرعاية.\n\nهل تود الاستفسار عن فحص محدد، أو تجهيز جهاز طبي معين، أو معرفة إجراءات البلاغات؟`;

    if (/تروبونين|troponin/i.test(cleaned)) {
      fallbackReply = `يا هلا فيك! فحص التروبونين (Troponin) هو فحص دم معملي دقيق جداً يُستخدم لقياس بروتينات التروبونين في عضلة القلب. يرتفع تركيزه عند حدوث أي إجهاد أو تلف لعضلة القلب، ويُعد المؤشر الذهبي لتشخيص احتشاء عضلة القلب (الجلطة القلبية).\n\nفي قسم الطوارئ، نعتمد على شرائح الفحص السريع (Point of Care) وظهور النتيجة خلال 15 دقيقة لبدء بروتوكول قسطرة القلب عند اللزوم.`;
    } else if (/أشعة|x-ray|جهاز الأشعة/i.test(cleaned)) {
      fallbackReply = `أهلاً بك! جهاز الأشعة السينية المتنقل (Mobile X-Ray MX-200) مصمم للوصول لأسرّة المرضى في الطوارئ والعناية المركزة دون الحاجة لنقل المريض.\n\nإرشادات السلامة:\n1. ارتداء مريلة الرصاص الواقية لمسافة لا تقل عن مترين.\n2. فحص محاذاة الكوليماتور والفرامل الميكانيكية للذراع قبل التشغيل.\n3. في حال سماع أي صوت احتكاك أو عطل، يُسجل بلاغ فوري عبر نظام البلاغات.`;
    } else if (/ضغط|ضغط الدم|hypertension/i.test(cleaned)) {
      fallbackReply = `أهلاً بك! قياس ضغط الدم الطبيعي للبالغين يكون عادة حوالي 120/80 ملم زئبق. يُعتبر القياس مرتفعاً إذا تجاوز 130/80 في قراءات متكررة في حالة الراحة. يُنصح دائماً بتفادي المنبهات والتوتر قبل القياس، وتدوين القراءات في جدول منتظم لمراجعتها مع طبيبك.`;
    }

    return res.json({
      answer: fallbackReply,
      category: "تثقيف صحي وبحث",
      confidence: "نظام معرفي إرشادي",
      emergency: false,
      disclaimer: "طبيبتك منار شخصية اصطناعية تثقيفية. في الحالات الحرجة يرجى مراجعة الطوارئ فوراً.",
    });
  } catch (error: any) {
    console.error("Error in /api/manar/ask:", error);
    res.status(500).json({ error: "فشل في معالجة الرد، يرجى المحاولة لاحقاً." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, process.env.HOST || "127.0.0.1", () => {
    console.log(`[Ain Al-Mustashfa] Server running on http://127.0.0.1:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;

