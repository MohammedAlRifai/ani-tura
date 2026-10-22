import React, { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

interface OnboardingTourProps {
  setActiveTab?: (tab: string) => void;
  openScanner?: () => void;
  openNewReport?: () => void;
}

export const TOUR_STORAGE_KEY = "ain_hospital_onboarding_completed_v1";

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  setActiveTab,
}) => {
  const runTour = useCallback(() => {
    // If user is on a different tab, we recommend switching to dashboard for optimal viewing
    if (setActiveTab) {
      setActiveTab("dashboard");
    }

    const steps: DriveStep[] = [
      {
        element: "#tour-brand",
        popover: {
          title: "مرحباً بك في منصة عين المستشفى 🏥",
          description:
            "منظومتك المتكاملة لإدارة التشغيل الطبي، الصيانة الطبية والوقائية (PPM)، تتبع الأصول، وسلاسل الإمداد الميدانية.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-new-report-btn",
        popover: {
          title: "تسجيل بلاغ عطل فوري 🚨",
          description:
            "انقر هنا لرفع بلاغ عطل فني في أي جهاز طبي أو مرفق مستشفى مع إمكانية إرفاق الصور، تحديد الأولوية وفريق الصيانة المختص.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-reports-tab",
        popover: {
          title: "إدارة ومتابعة البلاغات 📋",
          description:
            "استعرض كافة البلاغات المرفوعة، نسب الإنجاز، الرسوم البيانية التفاعلية لفرق الصيانة، وتحديث حالة البلاغ مباشرة.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-scanner-btn",
        popover: {
          title: "المسح الضوئي الذكي (QR & Barcode) 📷",
          description:
            "امسح رمز QR الخاص بالأجهزة الطبية أو باركود قطع الغيار عبر كاميرا جهازك، لتسجيل الصيانة أو ربط حركات المخزون وأوامر الشراء آلياً.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-manar-btn",
        popover: {
          title: "طبيبتك منار - المساعد الذكي 🤖",
          description:
            "المساعد التوليدي المدعوم بالذكاء الاصطناعي للاستفسار عن بروتوكولات الصيانة الطبية، معايير CBAHI، ودليل تشغيل الأجهزة الحرج.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-role-btn",
        popover: {
          title: "تبديل الصلاحيات والمزامنة 👥",
          description:
            "يمكنك التبديل بين الأدوار المختلفة (مدير، فني، تمريض، مهندس) لتجربة الواجهات المخصصة لكل دور، مع دعم العمل بدون إنترنت (Offline).",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-theme-btn",
        popover: {
          title: "النمط الليلي وراحة العين في الورديات 🌙",
          description:
            "يتكيف التطبيق تلقائياً مع ورديات العمل المسائية (19:00 - 06:00) وإعدادات جهازك لتخفيف إجهاد العين للفنيين، مع إمكانية التبديل اليدوي في أي وقت.",
          side: "bottom",
          align: "end",
        },
      },
    ];

    // Filter steps to only those currently visible in DOM
    const availableSteps = steps.filter((s) => {
      if (typeof s.element === "string") {
        return !!document.querySelector(s.element);
      }
      return true;
    });

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "#0F2826",
      overlayOpacity: 0.75,
      stagePadding: 6,
      stageRadius: 16,
      allowClose: true,
      doneBtnText: "إنهاء الجولة ✓",
      nextBtnText: "التالي ←",
      prevBtnText: "→ السابق",
      progressText: "{{current}} من {{total}}",
      steps: availableSteps.length > 0 ? availableSteps : steps,
      onDestroyed: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      },
    });

    driverObj.drive();
  }, [setActiveTab]);

  // Auto-launch on first login after page load
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        runTour();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [runTour]);

  // Expose runTour globally for header help button
  useEffect(() => {
    (window as any).__startHospitalTour = runTour;
    return () => {
      delete (window as any).__startHospitalTour;
    };
  }, [runTour]);

  return null;
};
