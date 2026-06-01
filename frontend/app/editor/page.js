"use client";





import { useCallback, useEffect, useMemo, useRef, useState } from "react";


import { useTheme, ThemeToggle } from "../components/ThemeProvider";


import dynamic from "next/dynamic";





// shadcn/ui components


import { Button } from "@/components/ui/button";


import { Badge as ShadBadge } from "@/components/ui/badge";


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


import { Input } from "@/components/ui/input";


import { Textarea } from "@/components/ui/textarea";


import { Switch as ShadSwitch } from "@/components/ui/switch";


import { Progress } from "@/components/ui/progress";


import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // keeping for future use


import { Separator } from "@/components/ui/separator";


import { ScrollArea } from "@/components/ui/scroll-area";


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import { findInTextWithAnchor } from "@/lib/utils";





// Dynamically import the editor to avoid SSR issues


const ProofreadEditor = dynamic(() => import("../components/ProofreadEditor"), {


  ssr: false,


  loading: () => (


    <div className="flex items-center justify-center p-8">


      <div className="text-sm" style={{ color: "var(--text-muted)" }}>


        Φόρτωση...


      </div>


    </div>


  ),


});





const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


// Upload goes directly to the backend to bypass the Next.js proxy body-size limit.


const UPLOAD_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";





// ============================================


// AUTHENTICATED FETCH HELPER


// ============================================


function getStoredPassword() {


  if (typeof window === "undefined") return "";


  return sessionStorage.getItem("app_password") || "";


}





async function authFetch(url, options = {}) {


  const pw = getStoredPassword();


  const headers = { ...(options.headers || {}) };


  if (pw) headers["X-App-Password"] = pw;


  


  const res = await fetch(url, { ...options, headers });


  


  // If 401, clear stored password (will trigger re-login)


  if (res.status === 401) {


    sessionStorage.removeItem("app_password");


    window.location.reload();


  }


  


  return res;


}





// For download URLs opened via window.open (can't set headers)


function downloadUrl(path) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const pw = getStoredPassword();
  const separator = path.includes("?") ? "&" : "?";
  const fullPath = `${base}${path}`;
  return pw ? `${fullPath}${separator}pw=${encodeURIComponent(pw)}` : fullPath;
}





const STYLE_OPTIONS = [


  { id: "academic", label: "Ακαδημαϊκό / Επιστημονικό" },


  { id: "legal", label: "Νομικό / Επίσημο" },


  { id: "journalistic", label: "Δημοσιογραφικό" },


  { id: "literary", label: "Λογοτεχνικό" },


  { id: "casual", label: "Καθημερινό / Ανεπίσημο" },


  { id: "business", label: "Επαγγελματικό / Εταιρικό" },


  { id: "technical", label: "Τεχνική τεκμηρίωση" },


  { id: "religious", label: "Θεολογικό / Θρησκευτικό" },


  { id: "history", label: "Ιστορικό" },


  { id: "marketing", label: "Marketing / Διαφημιστικό" },


  { id: "other", label: "Άλλο…" },


];





const INTENSITY_OPTIONS = [


  { id: "light", label: "Light" },


  { id: "medium", label: "Medium" },


  { id: "high", label: "High" },


];





const cls = (...xs) => xs.filter(Boolean).join(" ");





// ============================================


// REUSABLE COMPONENTS (using CSS variables)


// ============================================





function Badge({ variant = "default", children }) {


  const variantMap = {


    default: "secondary",


    primary: "default",


    success: "outline",


    error: "destructive",


    outline: "outline",


  };


  const colorClass = {


    default: "",


    primary: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",


    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15",


    error: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",


    outline: "",


  };


  return (


    <ShadBadge variant={variantMap[variant] || "secondary"} className={`text-[10px] font-semibold tracking-wider uppercase ${colorClass[variant] || ""}`}>


      {children}


    </ShadBadge>


  );


}





function StatusBadge({ status }) {


  const map = {


    pending: { variant: "outline", label: "PENDING" },


    accepted: { variant: "success", label: "ACCEPTED" },


    rejected: { variant: "error", label: "REJECTED" },


  };


  const { variant, label } = map[status] || map.pending;


  return <Badge variant={variant}>{label}</Badge>;


}





function PillButton({ active, onClick, children }) {


  return (


    <Button variant={active ? "default" : "outline"} size="sm" onClick={onClick}


      className={cls("rounded-full text-xs h-7", active && "shadow-sm")}>


      {children}


    </Button>


  );


}





function Switch({ checked, onChange }) {


  return (


    <button


      type="button"


      role="switch"


      aria-checked={checked}


      onClick={() => onChange(!checked)}


      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"


      style={{ backgroundColor: checked ? "var(--primary)" : "var(--border)" }}


    >


      <span


        className="pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform"


        style={{


          backgroundColor: "#fff",


          transform: checked ? "translateX(16px)" : "translateX(0px)",


        }}


      />


    </button>


  );


}





function UndoIcon({ className }) {


  return (


    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">


      <path d="M3 7v6h6" />


      <path d="M3 13a9 9 0 1 0 2.636-6.364L3 9" />


    </svg>


  );


}





function RedoIcon({ className }) {


  return (


    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">


      <path d="M21 7v6h-6" />


      <path d="M21 13a9 9 0 1 1-2.636-6.364L21 9" />


    </svg>


  );


}





function UploadIcon({ className }) {


  return (


    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">


      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />


      <polyline points="17,8 12,3 7,8" />


      <line x1="12" y1="3" x2="12" y2="15" />


    </svg>


  );


}





function ArrowLeftIcon({ className }) {


  return (


    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">


      <path d="M19 12H5M12 19l-7-7 7-7" />


    </svg>


  );


}





function CloseIcon({ className }) {


  return (


    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">


      <path d="M18 6L6 18M6 6l12 12" />


    </svg>


  );


}





// ============================================


// MAIN COMPONENT


// ============================================





export default function EditorPage() {


  const { theme } = useTheme();


  const isDark = theme === "dark";





  // ============================================


  // AUTH STATE


  // ============================================


  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const [authChecked, setAuthChecked] = useState(false);


  const [loginPassword, setLoginPassword] = useState("");


  const [loginError, setLoginError] = useState("");





  useEffect(() => {


    const pw = sessionStorage.getItem("app_password") || "";


    fetch(`${UPLOAD_URL}/api/auth`, {


      method: "POST",


      headers: { "Content-Type": "application/json", "X-App-Password": pw },


      body: JSON.stringify({ password: pw }),


    })


      .then((r) => {


        if (r.ok) {


          setIsAuthenticated(true);


        }


        setAuthChecked(true);


      })


      .catch(() => setAuthChecked(true));


  }, []);





  const handleLogin = async () => {


    setLoginError("");


    try {


      const pw = loginPassword.trim();


      const res = await fetch(`${UPLOAD_URL}/api/auth`, {


        method: "POST",


        headers: { 


          "Content-Type": "application/json",


          "X-App-Password": pw,


        },


        body: JSON.stringify({ password: pw }),


      });


      if (res.ok) {


        sessionStorage.setItem("app_password", pw);


        setIsAuthenticated(true);


      } else {


        setLoginError("Λάθος κωδικός");


      }


    } catch {


      setLoginError("Σφάλμα σύνδεσης");


    }


  };





  const [step, setStep] = useState("upload");


  const [file, setFile] = useState(null);


  const [sessionId, setSessionId] = useState(null);





  const [config, setConfig] = useState(null);


  const [selectedModel, setSelectedModel] = useState("");





  const [textDescription, setTextDescription] = useState("");


  const [customInstructions, setCustomInstructions] = useState("");





  const [modules, setModules] = useState({


    translation_check: false,


    fact_check: false,


    web_fact_check: false,


    style_check: false,


    style_type: "academic",


    style_other: "",


    style_intensity: "light",


    allow_sentence_level: false,


  });





  const [paragraphs, setParagraphs] = useState([]);


  const [footnotes, setFootnotes] = useState([]);


  const [corrections, setCorrections] = useState([]);


  const [corrPage, setCorrPage] = useState(0);


  const CORRECTIONS_PER_PAGE = 500;


  const shouldPaginate = corrections.length > CORRECTIONS_PER_PAGE;


  


  // Reset pagination when corrections load


  useEffect(() => { setCorrPage(0); }, [corrections.length]);


  const [activeCorrection, setActiveCorrection] = useState(null);





  // Editor ref


  const editorRef = useRef(null);





  // Drag & Drop state


  const [isDragging, setIsDragging] = useState(false);





  // Plain text input state


  const [plainTextMode, setPlainTextMode] = useState(false);


  const [plainText, setPlainText] = useState("");


  const [textTitle, setTextTitle] = useState("");


  const [textUploading, setTextUploading] = useState(false);





  const [canUndo, setCanUndo] = useState(false);


  const [canRedo, setCanRedo] = useState(false);





  const [verificationResult, setVerificationResult] = useState(null);


  const [showDownloadModal, setShowDownloadModal] = useState(false);


  const [downloadLoading, setDownloadLoading] = useState(false);





  // Safety check state


  const [charStats, setCharStats] = useState({ original: 0, working: 0, diff: 0 });


  const [safetyData, setSafetyData] = useState(null);


  const [showDiffPreviewModal, setShowDiffPreviewModal] = useState(false);


  const [loadingSafetyCheck, setLoadingSafetyCheck] = useState(false);





  // Custom Correction Modal State


  const [showCustomCorrectionModal, setShowCustomCorrectionModal] = useState(false);


  const [customCorrectionData, setCustomCorrectionData] = useState({


    original: "",


    suggested: "",


    context: "",


    paragraphNumber: 0,


  });


  const [customCorrectionLoading, setCustomCorrectionLoading] = useState(false);





  const [error, setError] = useState(null);


  


  // Auto-dismiss error after 8 seconds


  useEffect(() => {


    if (error) {


      const timer = setTimeout(() => setError(null), 8000);


      return () => clearTimeout(timer);


    }


  }, [error]);





  const [status, setStatus] = useState({


    status: null,


    progress: 0,


    total_chunks: 0,


    correction_count: 0,


  });





  const correctionRefs = useRef({});


  const correctionCardRefs = useRef({});  // Refs for cards in right panel


  const handleCorrectionRef = useRef(null);  // Ref to avoid stale closure in keyboard handler





  useEffect(() => {


    const controller = new AbortController();


    const timer = setTimeout(() => controller.abort(), 8000);


    authFetch(`${API_URL}/api/config`, { signal: controller.signal })


      .then((res) => res.json())


      .then((data) => {


        clearTimeout(timer);


        setConfig(data);


        if (data?.models?.length) {
          const preferred = data.models.find((m) => m.id === "gemini-3-flash");
          setSelectedModel(preferred ? preferred.id : data.models[0].id);
        }


      })


      .catch((err) => {


        clearTimeout(timer);


        setError("Αδυναμία σύνδεσης με τον server.");


      });


    return () => { clearTimeout(timer); controller.abort(); };


  }, []);





  // ========== SESSION RECONNECT ==========


  // Persist sessionId to sessionStorage so it survives refresh


  useEffect(() => {


    if (sessionId) {


      sessionStorage.setItem('saved_session', sessionId);


    }


  }, [sessionId]);





  // On mount, check for saved session and reconnect


  useEffect(() => {


    const savedId = sessionStorage.getItem('saved_session');


    if (!savedId || sessionId) return; // Skip if already connected





    const reconnect = async () => {


      try {


        const statusRes = await authFetch(`${API_URL}/api/status/${savedId}`);


        if (!statusRes.ok) {


          sessionStorage.removeItem('saved_session');


          return;


        }


        const statusData = await statusRes.json();


        


        // Load corrections


        const corrRes = await authFetch(`${API_URL}/api/corrections/${savedId}`);


        if (!corrRes.ok) return;


        const corrData = await corrRes.json();





        // Load paragraphs


        const paraRes = await authFetch(`${API_URL}/api/paragraphs/${savedId}`);


        let paras = [];


        if (paraRes.ok) {


          const paraData = await paraRes.json();


          paras = paraData.paragraphs || [];


        }





        // Restore state


        setSessionId(savedId);


        setCorrections(corrData.corrections || []);


        setCanUndo(corrData.can_undo || false);


        setCanRedo(corrData.can_redo || false);


        if (paras.length) setParagraphs(paras);


        setStatus(statusData);





        // Go to review if ready/paused, or analyzing if still running


        if (statusData.status === "ready" || statusData.status === "paused") {


          setStep("review");


        } else if (statusData.status === "analyzing") {


          setStep("analyzing");


        }


        


        console.log(`Reconnected to session ${savedId}: ${statusData.status}, ${corrData.corrections?.length || 0} corrections`);


      } catch (e) {


        console.error("Reconnect failed:", e);


        sessionStorage.removeItem('saved_session');


      }


    };





    reconnect();


  }, []);





  // Keyboard shortcuts


  useEffect(() => {


    if (step !== "review") return;


    


    const handleKeyDown = (e) => {


      // Ignore if typing in an input


      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;


      


      // Ignore if modal is open


      if (showCustomCorrectionModal || showDownloadModal) return;


      


      const pendingCorr = corrections.filter((c) => c.status === "pending");


      


      // Find current active correction


      const currentCorr = activeCorrection !== null 


        ? corrections.find((c) => c.id === activeCorrection)


        : null;


      


      switch (e.key) {


        case "Enter":


        case " ": // Space


          e.preventDefault();


          if (currentCorr && currentCorr.status === "pending" && handleCorrectionRef.current) {


            handleCorrectionRef.current(currentCorr.id, "accept");


          }


          break;


          


        case "Backspace":


        case "Delete":


          e.preventDefault();


          if (currentCorr && currentCorr.status === "pending" && handleCorrectionRef.current) {


            handleCorrectionRef.current(currentCorr.id, "reject");


          }


          break;


          


        case "ArrowDown":


        case "j": // Vim-style


          e.preventDefault();


          if (pendingCorr.length === 0) break;


          


          if (activeCorrection === null) {


            // Select first pending


            const first = pendingCorr[0];


            setActiveCorrection(first.id);


            scrollToCorrection(first.id);


            scrollToCorrectionCard(first.id);


          } else {


            // Find next pending


            const currentIdx = corrections.findIndex((c) => c.id === activeCorrection);


            const next = corrections.find((c, idx) => idx > currentIdx && c.status === "pending");


            if (next) {


              setActiveCorrection(next.id);


              scrollToCorrection(next.id);


              scrollToCorrectionCard(next.id);


            }


          }


          break;


          


        case "ArrowUp":


        case "k": // Vim-style


          e.preventDefault();


          if (pendingCorr.length === 0) break;


          


          if (activeCorrection === null) {


            // Select last pending


            const last = pendingCorr[pendingCorr.length - 1];


            setActiveCorrection(last.id);


            scrollToCorrection(last.id);


            scrollToCorrectionCard(last.id);


          } else {


            // Find previous pending


            const currentIdx = corrections.findIndex((c) => c.id === activeCorrection);


            let prev = null;


            for (let i = currentIdx - 1; i >= 0; i--) {


              if (corrections[i].status === "pending") {


                prev = corrections[i];


                break;


              }


            }


            if (prev) {


              setActiveCorrection(prev.id);


              scrollToCorrection(prev.id);


              scrollToCorrectionCard(prev.id);


            }


          }


          break;


          


        case "Escape":


          setActiveCorrection(null);


          break;


      }


    };


    


    window.addEventListener("keydown", handleKeyDown);


    return () => window.removeEventListener("keydown", handleKeyDown);


  }, [step, activeCorrection, corrections, showCustomCorrectionModal, showDownloadModal]);





  useEffect(() => {


    if (step !== "analyzing" || !sessionId) return;





    let alive = true;


    const tick = async () => {


      try {


        const res = await authFetch(`${API_URL}/api/status/${sessionId}`);


        if (!res.ok) return;


        const data = await res.json();


        if (!alive) return;


        setStatus(data);


        setCanUndo(data.can_undo || false);


        setCanRedo(data.can_redo || false);





        if (data.status === "error") {


          setError(data.error_message || "Analysis error.");


          setStep("configure");


        }


        


        // DON'T fetch corrections during analysis — only track count for display


        // This prevents repeated full highlight rebuilds that freeze the editor


        


        // Analysis complete or paused — load corrections ONCE and move to review


        if (data.status === "ready" || data.status === "paused") {


          try {


            const corrRes = await authFetch(`${API_URL}/api/corrections/${sessionId}`);


            if (corrRes.ok) {


              const corrData = await corrRes.json();


              setCorrections(corrData.corrections || []);


              setActiveCorrection(null);


              correctionRefs.current = {};


              setStep("review");


            }


          } catch (e) {


            console.error("Failed to fetch corrections:", e);


            setError("Analysis complete but failed to load corrections. Refresh the page.");


          }


        }


      } catch {


        // ignore transient


      }


    };





    tick();


    const id = setInterval(tick, 3000);


    return () => {


      alive = false;


      clearInterval(id);


    };


  }, [step, sessionId]);





  const handleFileUpload = async (e) => {


    const uploadedFile = e.target.files?.[0];


    if (!uploadedFile) return;





    setError(null);


    setFile(uploadedFile);





    const formData = new FormData();


    formData.append("file", uploadedFile);





    try {


      const res = await authFetch(`${UPLOAD_URL}/api/upload`, {


        method: "POST",


        body: formData,


      });


      if (!res.ok)


        throw new Error((await res.json()).detail || "Error upload");


      const data = await res.json();


      setSessionId(data.session_id);


      setParagraphs(data.paragraphs || []);


      setFootnotes(data.footnotes || []);


      setCorrections([]);


      setActiveCorrection(null);


      setCanUndo(false);


      setCanRedo(false);


      correctionRefs.current = {};


      setStep("configure");


    } catch (err) {


      setError(err.message);


    }


  };





  // Drag & Drop handlers


  const handleDragEnter = (e) => {


    e.preventDefault();


    e.stopPropagation();


    setIsDragging(true);


  };





  const handleDragLeave = (e) => {


    e.preventDefault();


    e.stopPropagation();


    if (e.currentTarget.contains(e.relatedTarget)) return;


    setIsDragging(false);


  };





  const handleDragOver = (e) => {


    e.preventDefault();


    e.stopPropagation();


  };





  const handleDrop = async (e) => {


    e.preventDefault();


    e.stopPropagation();


    setIsDragging(false);





    const droppedFile = e.dataTransfer.files?.[0];


    if (!droppedFile) return;





    if (!droppedFile.name.toLowerCase().endsWith(".docx")) {


      setError("Μόνο αρχεία Word (.docx)");


      return;


    }





    setError(null);


    setFile(droppedFile);





    const formData = new FormData();


    formData.append("file", droppedFile);





    try {


      const res = await authFetch(`${UPLOAD_URL}/api/upload`, {


        method: "POST",


        body: formData,


      });


      if (!res.ok)


        throw new Error((await res.json()).detail || "Error upload");


      const data = await res.json();


      setSessionId(data.session_id);


      setParagraphs(data.paragraphs || []);


      setFootnotes(data.footnotes || []);


      setCorrections([]);


      setActiveCorrection(null);


      setCanUndo(false);


      setCanRedo(false);


      correctionRefs.current = {};


      setStep("configure");


    } catch (err) {


      setError(err.message);


    }


  };





  // Plain text upload handler


  const handleTextUpload = async () => {


    if (!plainText.trim()) {


      setError("Το κείμενο δεν μπορεί να είναι κενό");


      return;


    }





    setTextUploading(true);


    setError(null);





    try {


      const res = await authFetch(`${UPLOAD_URL}/api/upload-text`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        body: JSON.stringify({


          text: plainText,


          title: textTitle || "Pasted Text",


        }),


      });


      if (!res.ok)


        throw new Error((await res.json()).detail || "Error upload");


      const data = await res.json();


      setSessionId(data.session_id);


      setParagraphs(data.paragraphs || []);


      setFootnotes(data.footnotes || []);


      setCorrections([]);


      setActiveCorrection(null);


      setCanUndo(false);


      setCanRedo(false);


      correctionRefs.current = {};


      setFile({ name: data.filename });


      setPlainText("");


      setTextTitle("");


      setPlainTextMode(false);


      setStep("configure");


    } catch (err) {


      setError(err.message);


    } finally {


      setTextUploading(false);


    }


  };





  const handleNewFile = () => {


    setFile(null);


    setSessionId(null);


    setParagraphs([]);


    setFootnotes([]);


    setCorrections([]);


    setActiveCorrection(null);


    setCanUndo(false);


    setCanRedo(false);


    setTextDescription("");


    setCustomInstructions("");


    setPlainText("");


    setTextTitle("");


    setPlainTextMode(false);


    setIsDragging(false);


    setModules({


      translation_check: false,


      fact_check: false,


      web_fact_check: false,


      style_check: false,


      style_type: "academic",


      style_other: "",


      style_intensity: "light",


      allow_sentence_level: false,


    });


    correctionRefs.current = {};


    setStep("upload");


  };





  const handleUndo = () => {


    const editor = editorRef.current?.getEditor?.();


    if (editor && editor.can().undo()) {


      editor.chain().focus().undo().run();


    }


  };





  const handleRedo = () => {


    const editor = editorRef.current?.getEditor?.();


    if (editor && editor.can().redo()) {


      editor.chain().focus().redo().run();


    }


  };





  const startAnalysis = async () => {


    setError(null);


    setStep("analyzing");


    setStatus({


      status: "analyzing",


      progress: 0,


      total_chunks: 0,


      correction_count: 0,


    });





    try {


      const payload = {


        session_id: sessionId,


        model: selectedModel,


        text_description: textDescription,


        custom_instructions: customInstructions,


        translation_check: Boolean(modules.translation_check),


        fact_check: Boolean(modules.fact_check),


        web_fact_check: Boolean(modules.web_fact_check),


        style_check: Boolean(modules.style_check),


        style_type: modules.style_type || "",


        style_other: modules.style_other || "",


        style_intensity: modules.style_intensity || "light",


        allow_sentence_level: Boolean(modules.allow_sentence_level),


      };





      // Fire and forget — don't await the full response


      // The status polling (useEffect above) will detect when analysis completes


      authFetch(`${API_URL}/api/analyze`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        body: JSON.stringify(payload),


      }).catch((err) => {


        // Only log — the polling will handle the actual result


        console.log("Analyze request completed or timed out:", err?.message || "ok");


      });





    } catch (err) {


      setError(err.message);


      setStep("configure");


    }


  };





  // Loading state for individual corrections


  const [correctionLoading, setCorrectionLoading] = useState(null); // correction id being processed





  const handleCorrection = async (correctionId, action) => {


    setCorrectionLoading(correctionId);


    setError(null);


    


    const correction = corrections.find(c => c.id === correctionId);


    if (!correction) {


      setCorrectionLoading(null);


      return;


    }


    


    try {


      if (action === "accept") {


        if (correction.type === "fix") {


          if (correction.target === "footnote") {


            // FOOTNOTE: Use backend (editor doesn't manage footnotes)


            const res = await authFetch(`${API_URL}/api/correction/${sessionId}`, {


              method: "POST",


              headers: { "Content-Type": "application/json" },


              body: JSON.stringify({ correction_id: correctionId, action: "accept" }),


            });


            if (!res.ok) {


              const err = await res.json();


              throw new Error(err.detail || "Footnote correction error");


            }


            // Update the footnote text locally so the display refreshes


            const fnId = correction.footnote_id;


            if (fnId && correction.original && correction.suggested !== undefined) {


              setFootnotes((prev) => prev.map((fn) => {


                if (fn.id === fnId) {


                  return { ...fn, text: fn.text.replace(correction.original, correction.suggested) };


                }


                return fn;


              }));


            }


          } else {


            // BODY: Apply directly in the TipTap editor (client-side)


            // Flash green before replacing text so the user sees the acceptance
            editorRef.current?.markCorrectionAccepted(correctionId);
            await new Promise(resolve => setTimeout(resolve, 380));
            const success = editorRef.current?.applyCorrection(correctionId);


            if (!success) {


              throw new Error(


                `Could not find "${(correction.original || "").slice(0, 40)}" in the editor. ` +


                `It may have been manually edited.`


              );


            }


          }


        }


        // Update correction status locally


        let updatedCorr;


        setCorrections((prev) => {


          updatedCorr = prev.map((c) =>


            c.id === correctionId ? { ...c, status: "accepted" } : c


          );


          return updatedCorr;


        });


        


        // Notify backend of status change (fire-and-forget)


        authFetch(`${API_URL}/api/correction-status/${sessionId}`, {


          method: "POST",


          headers: { "Content-Type": "application/json" },


          body: JSON.stringify({ correction_id: correctionId, status: "accepted" }),


        }).catch(() => {}); // Don't block on status sync


        


      } else if (action === "reject") {


        // Remove highlight immediately (no full re-highlight needed)


        editorRef.current?.removeSingleHighlight?.(correctionId);


        


        let updatedCorr;


        setCorrections((prev) => {


          updatedCorr = prev.map((c) =>


            c.id === correctionId ? { ...c, status: "rejected" } : c


          );


          return updatedCorr;


        });


        


        authFetch(`${API_URL}/api/correction-status/${sessionId}`, {


          method: "POST",


          headers: { "Content-Type": "application/json" },


          body: JSON.stringify({ correction_id: correctionId, status: "rejected" }),


        }).catch(() => {});


      }


      


      // Auto-scroll to next pending correction


      setTimeout(() => {


        const currentCorr = corrections.map((c) =>


          c.id === correctionId ? { ...c, status: action === "accept" ? "accepted" : "rejected" } : c


        );


        const currentIndex = currentCorr.findIndex((c) => c.id === correctionId);


        const nextPending = currentCorr.find((c, idx) => idx > currentIndex && c.status === "pending");


        


        if (nextPending) {


          setActiveCorrection(nextPending.id);


          scrollToCorrection(nextPending.id);


          scrollToCorrectionCard(nextPending.id);


        } else {


          const anyPending = currentCorr.find((c) => c.status === "pending");


          if (anyPending) {


            setActiveCorrection(anyPending.id);


            scrollToCorrection(anyPending.id);


            scrollToCorrectionCard(anyPending.id);


          } else {


            setActiveCorrection(null);


          }


        }


      }, 100);


      


    } catch (err) {


      setError(err.message);


    } finally {


      setCorrectionLoading(null);


    }


  };


  


  // Keep ref updated for keyboard handler


  handleCorrectionRef.current = handleCorrection;


  handleCorrectionRef.current = handleCorrection;





  const acceptAll = async () => {


    const pendingCount = corrections.filter((c) => c.status === "pending").length;


    const proceed = window.confirm(


      `Αποδοχή ${pendingCount} διορθώσεων;\n\nΜπορεί να αναιρεθεί με Ctrl+Z.`


    );


    if (!proceed) return;





    let accepted = 0;


    let failed = 0;


    


    // Sort corrections by paragraph number descending, so later ones are applied first


    // This avoids position shifts affecting earlier corrections


    const pendingFixes = corrections


      .filter((c) => c.status === "pending")


      .sort((a, b) => (b.paragraph_number || 0) - (a.paragraph_number || 0));


    


    for (const corr of pendingFixes) {


      if (corr.type === "fix") {


        if (corr.target === "footnote") {


          // Footnote: use backend


          try {


            const res = await authFetch(`${API_URL}/api/correction/${sessionId}`, {


              method: "POST",


              headers: { "Content-Type": "application/json" },


              body: JSON.stringify({ correction_id: corr.id, action: "accept" }),


            });


            if (res.ok) {


              accepted++;


              // Update footnote text locally


              if (corr.footnote_id && corr.original && corr.suggested !== undefined) {


                setFootnotes((prev) => prev.map((fn) => {


                  if (fn.id === corr.footnote_id) {


                    return { ...fn, text: fn.text.replace(corr.original, corr.suggested) };


                  }


                  return fn;


                }));


              }


            }


            else failed++;


          } catch { failed++; }


        } else {


          // Body: apply in editor


          const success = editorRef.current?.applyCorrection(corr.id);


          if (success) accepted++;


          else failed++;


        }


      } else {


        // Suggestions: just mark accepted


        accepted++;


      }


    }


    


    // Update all statuses


    setCorrections((prev) =>


      prev.map((c) =>


        c.status === "pending" ? { ...c, status: "accepted" } : c


      )


    );


    


    // Notify backend of all status changes


    authFetch(`${API_URL}/api/corrections/${sessionId}/bulk`, {


      method: "POST",


      headers: { "Content-Type": "application/json" },


      body: JSON.stringify({ action: "accept_all" }),


    }).catch(() => {});





    if (failed > 0) {


      setError(`${accepted} εφαρμόστηκαν, ${failed} δεν βρέθηκαν.`);


    }


  };





  const rejectAll = async () => {


    const pendingCount = corrections.filter((c) => c.status === "pending").length;


    const proceed = window.confirm(


      `Απόρριψη ${pendingCount} διορθώσεων;`


    );


    if (!proceed) return;





    setCorrections((prev) =>


      prev.map((c) =>


        c.status === "pending" ? { ...c, status: "rejected" } : c


      )


    );


    


    // Notify backend


    authFetch(`${API_URL}/api/corrections/${sessionId}/bulk`, {


      method: "POST",


      headers: { "Content-Type": "application/json" },


      body: JSON.stringify({ action: "reject_all" }),


    }).catch(() => {});


  };





  const handleDownloadClick = async () => {


    setDownloadLoading(true);


    setError(null);


    try {


      // Get editor content (this IS the source of truth)


      const editorParagraphs = editorRef.current?.getEditorParagraphs?.() || [];


      


      if (editorParagraphs.length === 0) {


        setError("Δεν βρέθηκε περιεχόμενο");


        setDownloadLoading(false);


        return;


      }


      


      // Send editor content to backend to generate final docx


      const genRes = await authFetch(`${API_URL}/api/generate-download/${sessionId}`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        body: JSON.stringify({ 


          paragraphs: editorParagraphs,


          corrections: corrections, // Send correction statuses for footnote handling


        }),


      });


      


      if (!genRes.ok) {


        const err = await genRes.json();


        throw new Error(err.detail || "Document generation error");


      }


      


      const result = await genRes.json();


      setVerificationResult(result);


      setShowDownloadModal(true);


    } catch (err) {


      setError(err.message);


    } finally {


      setDownloadLoading(false);


    }


  };





  const downloadCorrected = (force = false) => {


    window.open(downloadUrl(`/api/download/${sessionId}${force ? "?force=true" : ""}`), "_blank");


  };





  const downloadOriginal = () => {


    window.open(downloadUrl(`/api/download/${sessionId}/original`), "_blank");


  };





  const downloadReport = () => {


    window.open(downloadUrl(`/api/download/${sessionId}/report`), "_blank");


  };





  const downloadBundle = () => {


    window.open(downloadUrl(`/api/download/${sessionId}/bundle`), "_blank");


  };





  const scrollToCorrection = (correctionId) => {


    setActiveCorrection(correctionId);


    


    // Try to scroll to the correction in the editor


    const tryScroll = (attempt) => {


      // Strategy 1: Find the TipTap mark in the DOM


      const editorInstance = editorRef.current?.getEditor?.();


      const editorEl = editorInstance?.view?.dom;


      


      if (editorEl) {


        const mark = editorEl.querySelector(`[data-correction-id="${correctionId}"]`);


        if (mark) {


          mark.scrollIntoView({ behavior: "smooth", block: "center" });


          // Flash effect


          mark.style.outline = "2px solid var(--primary)";


          mark.style.outlineOffset = "2px";


          setTimeout(() => {


            mark.style.outline = "";


            mark.style.outlineOffset = "";


          }, 1500);


          return;


        }


      }


      


      // Strategy 2: Find the text position in editor and scroll via selection


      const corr = corrections.find(c => c.id === correctionId);


      if (corr && corr.original && editorInstance) {


        try {


          // Build position map for the target paragraph


          const targetPara = corr.paragraph_number || 0;


          let found = false;


          


          if (targetPara > 0) {


            let nonEmptyCount = 0;


            editorInstance.state.doc.forEach((node, offset) => {


              if (found) return;


              if (node.type.name !== "paragraph" || !node.textContent.trim()) return;


              nonEmptyCount++;


              if (nonEmptyCount !== targetPara) return;


              


              const text = node.textContent;


              const idx = findInTextWithAnchor(text, corr.original, corr.anchor || "", []);


              if (idx === -1) return;


              


              // Calculate approximate editor position


              const domNode = editorInstance.view.nodeDOM(offset);


              if (domNode) {


                domNode.scrollIntoView({ behavior: "smooth", block: "center" });


                found = true;


              }


            });


          }


          


          if (found) return;


        } catch (e) {


          // Ignore errors


        }


      }


      


      // Strategy 3: Retry after highlights re-render (marks may not be in DOM yet)


      if (attempt < 3) {


        setTimeout(() => tryScroll(attempt + 1), 200);


        return;


      }


      


      // Strategy 4: Fallback for footnotes (ref-based)


      correctionRefs.current[correctionId]?.scrollIntoView({


        behavior: "smooth",


        block: "center",


      });


    };


    


    tryScroll(0);


  };





  // Scroll to correction card in right panel (when clicking highlight in text)


  const scrollToCorrectionCard = (correctionId) => {


    setActiveCorrection(correctionId);


    correctionCardRefs.current[correctionId]?.scrollIntoView({


      behavior: "smooth",


      block: "center",


    });


  };





  // Debounce timer for editor sync


  const syncTimeoutRef = useRef(null);





  // Handle editor content changes (user typing)


  // No more sync to backend - editor IS the source of truth


  const handleEditorContentChange = useCallback((html) => {


    // Nothing to sync - the editor content will be sent to backend only on download


  }, []);





  // Handle correction click in editor


  const handleEditorCorrectionClick = useCallback((correctionId) => {


    setActiveCorrection(correctionId);


    correctionCardRefs.current[correctionId]?.scrollIntoView({


      behavior: "smooth",


      block: "center",


    });


  }, []);





  // ============================================


  // KEYBOARD SHORTCUTS


  // ============================================


  useEffect(() => {


    if (step !== "review") return;


    


    const handleKeyDown = (e) => {


      // Don't trigger shortcuts when typing in inputs or editor


      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;


      if (e.target.closest(".ProseMirror") || e.target.getAttribute("contenteditable")) return;


      


      // Don't trigger when modal is open


      if (showCustomCorrectionModal || showDownloadModal) return;


      


      const activeCorr = corrections.find((c) => c.id === activeCorrection);


      


      // Enter = Accept current correction


      if (e.key === "Enter" && activeCorr && activeCorr.status === "pending") {


        e.preventDefault();


        handleCorrection(activeCorr.id, "accept");


        return;


      }


      


      // Backspace or Delete = Reject current correction


      if ((e.key === "Backspace" || e.key === "Delete") && activeCorr && activeCorr.status === "pending") {


        e.preventDefault();


        handleCorrection(activeCorr.id, "reject");


        return;


      }


      


      // Arrow Down or J = Next correction


      if (e.key === "ArrowDown" || e.key === "j") {


        e.preventDefault();


        const currentIndex = corrections.findIndex((c) => c.id === activeCorrection);


        const nextIndex = currentIndex < corrections.length - 1 ? currentIndex + 1 : 0;


        const next = corrections[nextIndex];


        if (next) {


          setActiveCorrection(next.id);


          scrollToCorrection(next.id);


          scrollToCorrectionCard(next.id);


        }


        return;


      }


      


      // Arrow Up or K = Previous correction


      if (e.key === "ArrowUp" || e.key === "k") {


        e.preventDefault();


        const currentIndex = corrections.findIndex((c) => c.id === activeCorrection);


        const prevIndex = currentIndex > 0 ? currentIndex - 1 : corrections.length - 1;


        const prev = corrections[prevIndex];


        if (prev) {


          setActiveCorrection(prev.id);


          scrollToCorrection(prev.id);


          scrollToCorrectionCard(prev.id);


        }


        return;


      }


      


      // N = Next pending correction


      if (e.key === "n") {


        e.preventDefault();


        const currentIndex = corrections.findIndex((c) => c.id === activeCorrection);


        let nextPending = corrections.find((c, idx) => idx > currentIndex && c.status === "pending");


        if (!nextPending) {


          nextPending = corrections.find((c) => c.status === "pending");


        }


        if (nextPending) {


          setActiveCorrection(nextPending.id);


          scrollToCorrection(nextPending.id);


          scrollToCorrectionCard(nextPending.id);


        }


        return;


      }


      


      // Ctrl+Z = Undo


      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {


        e.preventDefault();


        handleUndo();


        return;


      }


      


      // Ctrl+Y or Ctrl+Shift+Z = Redo


      if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) {


        e.preventDefault();


        handleRedo();


        return;


      }


    };


    


    window.addEventListener("keydown", handleKeyDown);


    return () => window.removeEventListener("keydown", handleKeyDown);


  }, [step, activeCorrection, corrections, showCustomCorrectionModal, showDownloadModal, canUndo, canRedo, sessionId]);





  const showCorrections = step === "review" || (step === "analyzing" && corrections.length > 0);





  const [activeFilter, setActiveFilter] = useState("all");


  


  const counts = useMemo(() => {


    const pending = corrections.filter((c) => c.status === "pending").length;


    const accepted = corrections.filter((c) => c.status === "accepted").length;


    const rejected = corrections.filter((c) => c.status === "rejected").length;


    return { pending, accepted, rejected, total: corrections.length };


  }, [corrections]);





  const progressText = useMemo(() => {


    if (!status?.total_chunks) return "Προετοιμασία...";


    return `Chunk ${status.progress}/${status.total_chunks}`;


  }, [status]);





  const styleOtherVisible = modules.style_check && modules.style_type === "other";


  const webFactDisabled = !modules.fact_check;





  // ============================================


  // SAFETY CHECK


  // ============================================


  


  const fetchSafetyCheck = async () => {


    if (!sessionId) return;


    


    setLoadingSafetyCheck(true);


    try {


      const res = await authFetch(`${API_URL}/api/safety-check/${sessionId}`);


      if (!res.ok) throw new Error("Failed to fetch safety check");


      const data = await res.json();


      setSafetyData(data);


      setCharStats({


        original: data.original_chars,


        working: data.working_chars,


        diff: data.char_diff,


      });


    } catch (err) {


      setError(err.message);


    } finally {


      setLoadingSafetyCheck(false);


    }


  };





  const openDiffPreview = async () => {


    await fetchSafetyCheck();


    setShowDiffPreviewModal(true);


  };





  // ============================================


  // CUSTOM CORRECTION HANDLERS


  // ============================================


  


  const handleTextSelection = (paragraphNumber, paragraphText) => {


    const selection = window.getSelection();


    const selectedText = selection.toString();


    


    if (!selectedText || selectedText.length < 1) return;


    


    // Get larger context for accurate matching (especially for multiple occurrences)


    const fullText = paragraphText || "";


    const firstOccurrence = fullText.indexOf(selectedText);


    


    if (firstOccurrence === -1) return;


    


    // Get generous context (50 chars on each side)


    const contextStart = Math.max(0, firstOccurrence - 50);


    const contextEnd = Math.min(fullText.length, firstOccurrence + selectedText.length + 50);


    const context = fullText.slice(contextStart, contextEnd);


    


    setCustomCorrectionData({


      original: selectedText,


      suggested: selectedText, // Pre-fill with original


      context: context,


      paragraphNumber: paragraphNumber,


    });


    setShowCustomCorrectionModal(true);


  };





  const handleCustomCorrectionSubmit = async () => {


    if (!sessionId || !customCorrectionData.original) return;


    


    setCustomCorrectionLoading(true);


    setError(null);


    


    try {


      const res = await authFetch(`${API_URL}/api/custom-correction/${sessionId}`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        body: JSON.stringify({


          original: customCorrectionData.original,


          suggested: customCorrectionData.suggested,


          context: customCorrectionData.context,


          paragraph_number: customCorrectionData.paragraphNumber,


        }),


      });


      


      if (!res.ok) {


        const err = await res.json();


        throw new Error(err.detail || "Correction error");


      }


      


      const data = await res.json();


      


      // Update paragraphs with new content


      if (data.paragraphs) {


        setParagraphs(data.paragraphs);


      }


      


      // Add correction to list


      if (data.correction) {


        setCorrections((prev) => [...prev, data.correction]);


      }


      


      // Update undo/redo state


      setCanUndo(data.can_undo || false);


      setCanRedo(data.can_redo || false);


      


      // Close modal


      setShowCustomCorrectionModal(false);


      setCustomCorrectionData({ original: "", suggested: "", context: "", paragraphNumber: 0 });


      


    } catch (err) {


      setError(err.message);


    } finally {


      setCustomCorrectionLoading(false);


    }


  };





  const handleCustomCorrectionDelete = async () => {


    if (!sessionId || !customCorrectionData.original) return;


    


    setCustomCorrectionLoading(true);


    setError(null);


    


    try {


      const res = await authFetch(`${API_URL}/api/custom-correction/${sessionId}`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        body: JSON.stringify({


          original: customCorrectionData.original,


          suggested: "",  // Empty = delete


          context: customCorrectionData.context,


          paragraph_number: customCorrectionData.paragraphNumber,


        }),


      });


      


      if (!res.ok) {


        const err = await res.json();


        throw new Error(err.detail || "Deletion error");


      }


      


      const data = await res.json();


      


      if (data.paragraphs) {


        setParagraphs(data.paragraphs);


      }


      


      if (data.correction) {


        setCorrections((prev) => [...prev, data.correction]);


      }


      


      setCanUndo(data.can_undo || false);


      setCanRedo(data.can_redo || false);


      


      setShowCustomCorrectionModal(false);


      setCustomCorrectionData({ original: "", suggested: "", context: "", paragraphNumber: 0 });


      


    } catch (err) {


      setError(err.message);


    } finally {


      setCustomCorrectionLoading(false);


    }


  };





  // ============================================


  // RENDER: FOOTNOTES WITH HIGHLIGHTS


  // ============================================


  const renderFootnotesWithHighlights = () => {


    const byFootnote = {};


    corrections.forEach((c) => {


      if (c.target !== "footnote") return;


      const fid = c.footnote_id;


      if (!fid) return;


      if (!byFootnote[fid]) byFootnote[fid] = [];


      byFootnote[fid].push(c);


    });





    return footnotes.map((fn) => {


      const list = byFootnote[fn.id] || [];





      if (!list.length) {


        return (


          <div key={fn.id} className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>


            <span className="mr-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>[{fn.id}]</span>


            {fn.text}


          </div>


        );


      }





      const text = fn.text || "";


      let els = [];


      let last = 0;





      // Helper: Check if position is at word boundary (for footnotes)


      const isWordBoundaryFn = (text, pos) => {


        if (pos <= 0 || pos >= text.length) return true;


        const before = text[pos - 1];


        const wordChars = /[\p{L}\p{N}]/u;


        return !wordChars.test(before);


      };


      


      const isWordBoundaryEndFn = (text, pos) => {


        if (pos >= text.length) return true;


        const after = text[pos];


        const wordChars = /[\p{L}\p{N}]/u;


        return !wordChars.test(after);


      };





      const smartFindFn = (text, needle, anchor, startFrom = 0) => {


        if (!needle) return -1;


        


        if (anchor && anchor.length > needle.length) {


          const anchorIdx = text.indexOf(anchor, Math.max(0, startFrom - 50));


          if (anchorIdx !== -1) {


            const needleInAnchor = anchor.indexOf(needle);


            if (needleInAnchor !== -1) {


              const actualPos = anchorIdx + needleInAnchor;


              if (actualPos >= startFrom) return actualPos;


            }


          }


        }


        


        let pos = startFrom;


        while (pos < text.length) {


          const idx = text.indexOf(needle, pos);


          if (idx === -1) return -1;


          


          if (needle.length <= 3) {


            if (isWordBoundaryFn(text, idx) && isWordBoundaryEndFn(text, idx + needle.length)) {


              return idx;


            }


            pos = idx + 1;


          } else {


            return idx;


          }


        }


        return -1;


      };





      const idxOrMaxFn = (s, needle, anchor) => {


        const i = smartFindFn(s, needle, anchor);


        return i === -1 ? Number.MAX_SAFE_INTEGER : i;


      };





      // Filter out accepted "fix" corrections - they're already in the text


      const visibleCorrFn = list.filter(c => {


        if (c.status === "accepted" && c.type === "fix") {


          return false;


        }


        return true;


      });





      const sorted = [...visibleCorrFn].sort(


        (a, b) => idxOrMaxFn(text, a.original, a.anchor) - idxOrMaxFn(text, b.original, b.anchor)


      );





      sorted.forEach((c) => {


        const needle = c.original || "";


        const idx = smartFindFn(text, needle, c.anchor, last);


        if (idx === -1) return;





        if (idx > last) {


          els.push(<span key={`t-fn-${fn.id}-${last}`}>{text.slice(last, idx)}</span>);


        }





        const toneClass =


          c.status === "accepted"


            ? "bg-[var(--success)]/20 text-[var(--success)]"


            : c.status === "rejected"


            ? "bg-[var(--error)]/20 text-[var(--error)] line-through"


            : "bg-[var(--error)]/10 border-b-2 border-[var(--error)]";





        const ringClass = activeCorrection === c.id ? "ring-2 ring-[var(--primary)]" : "";





        els.push(


          <span


            key={`c-fn-${c.id}`}


            ref={(el) => (correctionRefs.current[c.id] = el)}


            className={cls("px-1 py-0.5 cursor-pointer transition-all", toneClass, ringClass)}


            onClick={(e) => {


              e.stopPropagation();


              scrollToCorrectionCard(c.id);


            }}


            title={`footnote • ${c.module || "core"} • ${c.type || "fix"} • ${c.scope || "token"}`}


          >


            {c.original}


          </span>


        );





        last = idx + needle.length;


      });





      if (last < text.length) {


        els.push(<span key={`t-fn-end-${fn.id}`}>{text.slice(last)}</span>);


      }





      return (


        <div key={fn.id} className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>


          <span className="mr-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>[{fn.id}]</span>


          {els}


        </div>


      );


    });


  };





  // ============================================


  // HELPER: Render text with formatting (bold/italic)


  // ============================================


  const renderFormattedText = (text, segments, startIdx = 0, endIdx = null) => {


    if (!segments || segments.length === 0) {


      return text;


    }


    


    const end = endIdx !== null ? endIdx : text.length;


    const result = [];


    let pos = 0;


    let segmentIdx = 0;


    let charInSegment = 0;


    


    // Find starting segment and position


    let charCount = 0;


    for (let i = 0; i < segments.length; i++) {


      const segLen = segments[i].text.length;


      if (charCount + segLen > startIdx) {


        segmentIdx = i;


        charInSegment = startIdx - charCount;


        break;


      }


      charCount += segLen;


    }


    


    // Build result from startIdx to endIdx


    let currentPos = startIdx;


    while (currentPos < end && segmentIdx < segments.length) {


      const seg = segments[segmentIdx];


      const segText = seg.text;


      const remainingInSeg = segText.length - charInSegment;


      const needed = end - currentPos;


      const take = Math.min(remainingInSeg, needed);


      


      const chunk = segText.slice(charInSegment, charInSegment + take);


      


      if (chunk) {


        let el = chunk;


        if (seg.bold && seg.italic) {


          el = <strong key={`fmt-${currentPos}`}><em>{chunk}</em></strong>;


        } else if (seg.bold) {


          el = <strong key={`fmt-${currentPos}`}>{chunk}</strong>;


        } else if (seg.italic) {


          el = <em key={`fmt-${currentPos}`}>{chunk}</em>;


        }


        result.push(el);


      }


      


      currentPos += take;


      charInSegment += take;


      


      if (charInSegment >= segText.length) {


        segmentIdx++;


        charInSegment = 0;


      }


    }


    


    return result.length === 1 ? result[0] : result;


  };





  // ============================================


  // RENDER: MAIN BODY WITH HIGHLIGHTS AND FORMATTING


  // ============================================


  const renderContentWithHighlights = () => {


    const byPara = {};


    corrections.forEach((c) => {


      if (c.target === "footnote") return;


      if (!byPara[c.paragraph_number]) byPara[c.paragraph_number] = [];


      byPara[c.paragraph_number].push(c);


    });





    // Helper: Check if position is at word boundary


    const isWordBoundary = (text, pos) => {


      if (pos <= 0 || pos >= text.length) return true;


      const before = text[pos - 1];


      const wordChars = /[\p{L}\p{N}]/u; // Unicode letters and numbers


      return !wordChars.test(before);


    };


    


    const isWordBoundaryEnd = (text, pos) => {


      if (pos >= text.length) return true;


      const after = text[pos];


      const wordChars = /[\p{L}\p{N}]/u;


      return !wordChars.test(after);


    };





    // Smart find that uses anchor/context or word boundaries


    const smartFind = (text, needle, anchor, startFrom = 0) => {


      if (!needle) return -1;


      


      // If we have anchor, use it to find the right occurrence


      if (anchor && anchor.length > needle.length) {


        const anchorIdx = text.indexOf(anchor, Math.max(0, startFrom - 50));


        if (anchorIdx !== -1) {


          // Find needle within anchor context


          const needleInAnchor = anchor.indexOf(needle);


          if (needleInAnchor !== -1) {


            const actualPos = anchorIdx + needleInAnchor;


            if (actualPos >= startFrom) {


              return actualPos;


            }


          }


        }


      }


      


      // Fallback: find with word boundary checking


      let pos = startFrom;


      while (pos < text.length) {


        const idx = text.indexOf(needle, pos);


        if (idx === -1) return -1;


        


        // Check word boundaries - but only for short words that might be substrings


        if (needle.length <= 3) {


          if (isWordBoundary(text, idx) && isWordBoundaryEnd(text, idx + needle.length)) {


            return idx;


          }


          // Skip this occurrence, try next


          pos = idx + 1;


        } else {


          // For longer strings, just use the first match


          return idx;


        }


      }


      return -1;


    };





    const idxOrMax = (s, needle, anchor) => {


      const i = smartFind(s, needle, anchor);


      return i === -1 ? Number.MAX_SAFE_INTEGER : i;


    };





    return paragraphs.map((para) => {


      const list = byPara[para.number] || [];


      const text = para.text || "";


      const segments = para.segments || [];


      const hasFormatting = segments.length > 0 && segments.some(s => s.bold || s.italic);


      


      // No corrections - just render with formatting


      if (!list.length) {


        return (


          <p 


            key={para.number} 


            className="mb-4 leading-relaxed text-sm cursor-text select-text" 


            style={{ color: "var(--text)" }}


            onMouseUp={() => handleTextSelection(para.number, para.text)}


          >


            {hasFormatting ? renderFormattedText(text, segments) : text}


          </p>


        );


      }





      // Has corrections - need to interleave formatting with highlights


      let els = [];


      let last = 0;





      // Filter out accepted "fix" corrections - they're already in the text


      // Only show: pending, rejected, and non-fix accepted (suggestions)


      const visibleCorr = list.filter(c => {


        if (c.status === "accepted" && c.type === "fix") {


          // Skip accepted fixes - the text has already changed


          return false;


        }


        return true;


      });





      const sorted = [...visibleCorr].sort(


        (a, b) => idxOrMax(text, a.original, a.anchor) - idxOrMax(text, b.original, b.anchor)


      );





      sorted.forEach((c) => {


        const needle = c.original || "";


        const idx = smartFind(text, needle, c.anchor, last);


        if (idx === -1) return;





        // Text before correction (with formatting)


        if (idx > last) {


          if (hasFormatting) {


            els.push(<span key={`t-${para.number}-${last}`}>{renderFormattedText(text, segments, last, idx)}</span>);


          } else {


            els.push(<span key={`t-${para.number}-${last}`}>{text.slice(last, idx)}</span>);


          }


        }





        const toneClass =


          c.status === "accepted"


            ? "bg-[var(--success)]/20 text-[var(--success)]"


            : c.status === "rejected"


            ? "bg-[var(--error)]/20 text-[var(--error)] line-through"


            : "bg-[var(--error)]/10 border-b-2 border-[var(--error)]";





        const ringClass = activeCorrection === c.id ? "ring-2 ring-[var(--primary)]" : "";





        // Display text: always show original since accepted fixes are filtered out


        const displayText = c.original || "";


        


        els.push(


          <span


            key={`c-${c.id}`}


            ref={(el) => (correctionRefs.current[c.id] = el)}


            className={cls("px-1 py-0.5 cursor-pointer transition-all", toneClass, ringClass)}


            onClick={(e) => {


              e.stopPropagation();


              scrollToCorrectionCard(c.id);


            }}


            title={`${c.module || "core"} • ${c.type || "fix"} • ${c.scope || "token"}`}


          >


            {hasFormatting 


              ? renderFormattedText(displayText, segments, idx, idx + needle.length)


              : displayText}


          </span>


        );





        last = idx + needle.length;


      });





      // Remaining text after last correction (with formatting)


      if (last < text.length) {


        if (hasFormatting) {


          els.push(<span key={`t-end-${para.number}`}>{renderFormattedText(text, segments, last)}</span>);


        } else {


          els.push(<span key={`t-end-${para.number}`}>{text.slice(last)}</span>);


        }


      }





      return (


        <p 


          key={para.number} 


          className="mb-4 leading-relaxed text-sm cursor-text select-text" 


          style={{ color: "var(--text)" }}


          onMouseUp={() => handleTextSelection(para.number, para.text)}


        >


          {els}


        </p>


      );


    });


  };





  // ============================================


  // RENDER


  // ============================================








  // Derived filter list (before early returns — Rules of Hooks)


  const filterCategories = useMemo(() => {


    const mods = new Set(corrections.map(c => c.module || "core"));


    const labelMap = { core: "Βασική", style: "Ύφος", translation: "Μετάφραση", fact: "Γεγονότα" };


    return [{ id: "all", label: "Όλες" }, ...Array.from(mods).map(m => ({ id: m, label: labelMap[m] || m }))];


  }, [corrections]);





  const visibleCorrections = useMemo(() =>


    activeFilter === "all" ? corrections : corrections.filter(c => (c.module || "core") === activeFilter),


  [corrections, activeFilter]);





  // ---- LOGIN SCREEN ----


  if (!authChecked) {


    return (


      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>


        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "transparent" }}></div>


      </div>


    );


  }





  if (!isAuthenticated) {


    return (


      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>


        <div className="absolute inset-0 pointer-events-none">


          <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[120px] opacity-30" style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />


          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] opacity-25" style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }} />


        </div>


        <div className="relative z-10 border rounded-2xl p-10 shadow-2xl backdrop-blur-xl" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", maxWidth: "420px", width: "100%" }}>


          <div className="flex flex-col items-center gap-4 mb-8">


            <div className="h-14 w-14 border rounded-xl flex items-center justify-center" style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-muted)" }}>


              <span className="text-xl font-bold tracking-widest" style={{ color: "var(--primary)" }}>PA</span>


            </div>


            <div className="text-center">


              <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>ProofreadAI</div>


              <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Απαιτείται κωδικός</div>


            </div>


          </div>


          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}


            onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} placeholder="Κωδικός πρόσβασης"


            className="w-full px-5 py-4 border rounded-xl text-sm mb-4 outline-none bg-transparent focus:ring-2 focus:ring-[var(--primary)]/50"


            style={{ borderColor: "var(--border)", color: "var(--text)" }} autoFocus />


          {loginError && <div className="text-sm mb-4 text-center font-medium" style={{ color: "var(--error)" }}>{loginError}</div>}


          <button onClick={handleLogin} className="w-full py-4 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg hover:opacity-90"


            style={{ backgroundColor: "var(--primary)", color: "#ffffff" }}>Είσοδος</button>


        </div>


      </div>


    );


  }


  // ---- MAIN UI ----


  return (


    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>


      <div>


      {/* ── Noëta Nav ── */}


      <nav className="app-nav" id="editor-nav" style={{ backdropFilter: "blur(8px)" }}>


        <a href="/" className="nav-logo">Noëta<span className="dot" /></a>


        <div className="nav-links">


          <a href="/" style={{ color: "var(--mid)" }}>Αρχική</a>


          <a href="/translate" style={{ color: "var(--mid)" }}>Μεταφραστής</a>


        </div>


        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>


          <ThemeToggle />


          {step === "review" && (


            <button className="editor-pill primary" onClick={handleNewFile} style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", padding: "10px 22px" }}>+ Νέο έργο</button>


          )}


        </div>


      </nav>





      {/* ── Error toast ── */}


      {error && (


        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, maxWidth: 420, background: "var(--rust)", color: "#fff", borderRadius: "var(--r-sm)", padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", display: "flex", gap: 12, alignItems: "flex-start" }}>


          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>{error}</div>


          <button onClick={() => setError(null)} style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer" }}>✕</button>


        </div>


      )}





      {/* ========== UPLOAD STEP ========== */}


      {step === "upload" && (


        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 60px 60px" }}>


          <div style={{ width: "100%", maxWidth: 640 }}>


            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 48, color: "var(--ink)" }}>


              Επιμέλεια<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>κειμένου</em>.


            </h1>





            {/* Mode tabs */}


            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>


              <button


                onClick={() => setPlainTextMode(false)}


                className={!plainTextMode ? "editor-pill primary" : "editor-pill"}


              >Αρχείο .docx</button>


              <button


                onClick={() => setPlainTextMode(true)}


                className={plainTextMode ? "editor-pill primary" : "editor-pill"}


              >Επικόλληση κειμένου</button>


            </div>





            {!plainTextMode && (


              <div


                style={{


                  border: `2px dashed ${isDragging ? "var(--accent)" : "var(--rule)"}`,


                  borderRadius: "var(--r-sm)",


                  padding: "60px 40px",


                  textAlign: "center",


                  cursor: "pointer",


                  background: isDragging ? "var(--accent-soft)" : "transparent",


                  transition: "all 0.3s var(--ease)",


                }}


                onDragEnter={handleDragEnter}


                onDragLeave={handleDragLeave}


                onDragOver={handleDragOver}


                onDrop={handleDrop}


                onClick={() => document.getElementById("file-input").click()}


              >


                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 16 }}>


                  {isDragging ? "Αφήστε εδώ" : "Κλικ ή σύρετε αρχείο"}


                </div>


                <div style={{ fontFamily: "var(--display)", fontSize: 18, color: "var(--mid-soft)" }}>Μόνο .docx</div>


                <input id="file-input" type="file" accept=".docx" onChange={handleFileUpload} className="hidden" />


              </div>


            )}





            {plainTextMode && (


              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>


                <input


                  type="text" placeholder="Τίτλος (προαιρετικό)" value={textTitle}


                  onChange={(e) => setTextTitle(e.target.value)}


                  style={{ fontFamily: "var(--sans)", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "12px 16px", fontSize: 14, background: "transparent", color: "var(--ink)", outline: "none" }}


                />


                <textarea


                  placeholder="Επικολλήστε ή γράψτε το κείμενό σας..."


                  value={plainText} onChange={(e) => setPlainText(e.target.value)}


                  style={{ fontFamily: "var(--display)", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "16px", fontSize: 16, lineHeight: 1.75, background: "transparent", color: "var(--ink)", minHeight: 280, resize: "vertical", outline: "none" }}


                />


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>


                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid)", letterSpacing: "0.06em" }}>{plainText.length.toLocaleString()} χαρακτήρες</span>


                  <button onClick={handleTextUpload} disabled={!plainText.trim() || textUploading}


                    className="editor-pill primary">{textUploading ? "..." : "Συνέχεια"}</button>


                </div>


              </div>


            )}


          </div>


        </div>


      )}





      {/* ========== CONFIGURE STEP ========== */}


      {step === "configure" && (


        <div style={{ minHeight: "100vh", paddingTop: 120, padding: "120px 60px 80px", maxWidth: 900, margin: "0 auto" }}>


          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40 }}>


            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(28px,4vw,48px)", fontWeight: 300, letterSpacing: "-0.02em", color: "var(--ink)" }}>


              Ρυθμίσεις <em style={{ fontStyle: "italic", color: "var(--accent)" }}>ανάλυσης</em>


            </h1>


            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--mid)", letterSpacing: "0.06em" }}>{file?.name}</div>


          </div>





          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>


            {/* Left: model + description + instructions */}


            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>


              <div>


                <div style={{ display: "none" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 8 }}>Μοντέλο</div>


                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}


                  style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "10px 14px", fontSize: 13, background: "transparent", color: "var(--ink)", outline: "none", fontFamily: "var(--mono)" }}>


                  {config?.models?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}


                </select>
                </div>


              </div>


              <div>


                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 8 }}>Περιγραφή κειμένου</div>


                <textarea value={textDescription} onChange={(e) => setTextDescription(e.target.value)}


                  rows={4} placeholder="π.χ. «Λογοτεχνική μετάφραση, ύφος Μέλβιλ»"


                  style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "10px 14px", fontSize: 13, background: "transparent", color: "var(--ink)", outline: "none", resize: "vertical", fontFamily: "var(--sans)" }} />


              </div>


              <div>


                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 8 }}>Ειδικές οδηγίες (προαιρετικό)</div>


                <textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)}


                  rows={3} placeholder="π.χ. «Μην αλλάξεις αρχαΐζοντες τύπους»"


                  style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "10px 14px", fontSize: 13, background: "transparent", color: "var(--ink)", outline: "none", resize: "vertical", fontFamily: "var(--sans)" }} />


              </div>


            </div>





            {/* Right: modules */}


            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>


              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 4 }}>Πρόσθετα modules</div>





              {[


                { key: "translation_check", label: "Έλεγχος μετάφρασης", desc: "Ξενισμοί, calques, false friends" },


                { key: "fact_check", label: "Έλεγχος γεγονότων", desc: "Ονόματα, ημερομηνίες, αριθμοί" },


                { key: "style_check", label: "Ύφος κειμένου", desc: "Ανάλυση ύφους και ροής" },


              ].map(({ key, label, desc }) => (


                <div key={key} style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>


                  <div>


                    <div style={{ fontSize: 13, fontWeight: 400, color: "var(--ink)", marginBottom: 2 }}>{label}</div>


                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid)" }}>{desc}</div>


                  </div>


                  <Switch checked={modules[key]} onChange={(v) => setModules(p => ({ ...p, [key]: v, ...(key === "fact_check" && !v ? { web_fact_check: false } : {}) }))} />


                </div>


              ))}





              {modules.style_check && (


                <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "14px 16px" }}>


                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--mid)", marginBottom: 10 }}>Τύπος ύφους</div>


                  <select value={modules.style_type} onChange={(e) => setModules(p => ({ ...p, style_type: e.target.value }))}


                    style={{ width: "100%", border: "1px solid var(--rule)", borderRadius: "var(--r-xs)", padding: "8px 12px", fontSize: 12, background: "transparent", color: "var(--ink)", outline: "none", fontFamily: "var(--mono)" }}>


                    {STYLE_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}


                  </select>


                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>


                    {INTENSITY_OPTIONS.map(opt => (


                      <button key={opt.id} onClick={() => setModules(p => ({ ...p, style_intensity: opt.id }))}


                        className={modules.style_intensity === opt.id ? "filter-chip active" : "filter-chip"}>


                        {opt.label}


                      </button>


                    ))}


                  </div>


                </div>


              )}





              {modules.fact_check && (


                <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>


                  <div>


                    <div style={{ fontSize: 13, color: "var(--ink)" }}>Πηγές Web</div>


                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid)" }}>Online fact-checking</div>


                  </div>


                  <Switch checked={modules.web_fact_check} onChange={(v) => setModules(p => ({ ...p, web_fact_check: v }))} />


                </div>


              )}


            </div>


          </div>





          <div style={{ marginTop: 40, display: "flex", gap: 16, alignItems: "center" }}>


            <button onClick={startAnalysis} className="editor-pill primary" style={{ fontSize: 13, padding: "12px 32px" }}>


              Εκκίνηση ανάλυσης


            </button>


            <button onClick={handleNewFile} className="editor-pill">Νέο αρχείο</button>


          </div>


        </div>


      )}





      {/* ========== ANALYZING / REVIEW / PAUSED ========== */}


      {(step === "analyzing" || step === "review") && (


        <div style={{ paddingTop: 90 }}>





          {/* ── Toolbar ── */}


          <div className="editor-toolbar">


            <div className="editor-doc-info">


              <div className="breadcrumb">


                <span>Έργο</span><span className="sep">›</span>


                <span>{file?.name || "Έγγραφο"}</span>


              </div>


              <h1>{file?.name?.replace(/\.[^/.]+$/, "") || "Επιμέλεια"}</h1>


              <div className="editor-doc-meta">


                <span>{paragraphs.length} παράγραφοι</span>


                <span className="dot">·</span>


                <span>{step === "analyzing" ? "Ανάλυση σε εξέλιξη..." : `${counts.total} διορθώσεις`}</span>


                {status?.tokens_used?.total > 0 && <>


                  <span className="dot">·</span>


                  <span>{(status.tokens_used.total).toLocaleString()} tokens</span>


                </>}


              </div>


            </div>


            <div className="editor-actions">


              {step === "analyzing" && (


                <button className="editor-pill" onClick={async () => {


                  try {


                    await authFetch(`${API_URL}/api/pause/${sessionId}`, { method: "POST" });


                    const corrRes = await authFetch(`${API_URL}/api/corrections/${sessionId}`);


                    if (corrRes.ok) { const d = await corrRes.json(); setCorrections(d.corrections || []); }


                    setStep("review");


                  } catch { setStep("review"); }


                }}>Παύση</button>


              )}


              {step === "review" && (


                <>


                  <button className="editor-pill" onClick={handleDownloadClick} disabled={downloadLoading}>


                    {downloadLoading ? "..." : "Εξαγωγή .docx"}


                  </button>


                  <button className="editor-pill primary" onClick={acceptAll} disabled={counts.pending === 0}>


                    Αποδοχή όλων


                  </button>

                </>
              )}
            </div>
          </div>

          {/* ── Analysis progress banner ── */}
          {step === "analyzing" && (
            <div style={{ background: "var(--accent-soft)", borderBottom: "1px solid var(--rule)", padding: "10px 60px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.06em" }}>
                Chunk {status?.progress}/{status?.total_chunks || "…"} · {corrections.length} διορθώσεις μέχρι τώρα
              </div>
              <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid)" }}>
                {status?.total_chunks ? `${Math.round((status.progress / status.total_chunks) * 100)}%` : ""}
              </div>
            </div>
          )}

          {/* ── 3-column canvas ── */}


          <div className="editor-canvas">










            {/* Center: TipTap editor */}


            <div className="editor-document">


              <ProofreadEditor


                ref={editorRef}


                paragraphs={paragraphs}


                corrections={corrections.filter(c => c.target !== "footnote")}


                onContentChange={handleEditorContentChange}


                onCorrectionClick={handleEditorCorrectionClick}


                readOnly={false}


              />


              {footnotes.length > 0 && (


                <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--rule-soft)" }}>


                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)", marginBottom: 16 }}>Υποσημειώσεις</div>


                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 10 }}>


                    {renderFootnotesWithHighlights()}


                  </div>


                </div>


              )}


            </div>





            {/* Right: corrections rail */}


            <aside className="editor-corrections">


              <div className="editor-corrections-head">


                <div className="label">Διορθώσεις</div>


                <div className="stats">


                  <strong>{counts.pending}</strong> εκκρεμείς


                </div>


              </div>





              <div className="editor-corrections-list" style={{ paddingBottom: 8 }}>


                {visibleCorrections.length === 0 && (


                  <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 16, color: "var(--mid-soft)", paddingTop: 16 }}>


                    {step === "analyzing" ? "Αναζήτηση…" : "Κανένα εύρημα."}


                  </div>


                )}





                {/* Pagination (500+) */}


                {shouldPaginate && (


                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0 12px", borderBottom: "1px solid var(--rule-soft)", marginBottom: 10 }}>


                    <button className="editor-pill" style={{ padding: "4px 10px", fontSize: 10 }}


                      disabled={corrPage === 0} onClick={() => setCorrPage(p => Math.max(0, p - 1))}>Προηγ.</button>


                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid)" }}>


                      {corrPage * CORRECTIONS_PER_PAGE + 1}–{Math.min((corrPage + 1) * CORRECTIONS_PER_PAGE, corrections.length)} / {corrections.length}


                    </span>


                    <button className="editor-pill" style={{ padding: "4px 10px", fontSize: 10 }}


                      disabled={(corrPage + 1) * CORRECTIONS_PER_PAGE >= corrections.length} onClick={() => setCorrPage(p => p + 1)}>Επόμ.</button>


                  </div>


                )}





                {(shouldPaginate


                  ? visibleCorrections.slice(corrPage * CORRECTIONS_PER_PAGE, (corrPage + 1) * CORRECTIONS_PER_PAGE)


                  : visibleCorrections


                ).map((c) => {


                  const isSelected = activeCorrection === c.id;


                  const isResolved = c.status !== "pending";


                  return (


                    <div


                      key={c.id}


                      ref={(el) => (correctionCardRefs.current[c.id] = el)}


                      className={`correction-card ${isResolved ? "resolved " + c.status : "pending"}${isSelected ? " focused" : ""}`}


                      onClick={() => scrollToCorrection(c.id)}


                      onMouseEnter={() => {


                        const mark = document.querySelector(`[data-correction-id="${c.id}"]`);


                        if (mark) mark.classList.add("noeta-focused");


                      }}


                      onMouseLeave={() => {


                        const mark = document.querySelector(`[data-correction-id="${c.id}"]`);


                        if (mark) mark.classList.remove("noeta-focused");


                      }}


                    >


                      <div className="cc-head">


                        <div className="cc-meta">
                          {c.paragraph_number ? <span style={{ color: "var(--mid)" }}>¶ {c.paragraph_number}</span> : null}


                        </div>


                        <span className="cc-status">


                          {c.status === "accepted" ? "Αποδεκτή" : c.status === "rejected" ? "Απορριφθείσα" : "Εκκρεμής"}


                        </span>


                      </div>


                      <div className="cc-diff">


                        <span className="from">{(c.original || "").slice(0, 60)}</span>


                        {c.type === "fix" && <><span className="arrow-mini">→</span><span className="to">{(c.suggested || "").slice(0, 60)}</span></>}


                      </div>


                      {c.reason && <div className="cc-reason">{c.reason}</div>}


                      {!isResolved && (


                        <div className="cc-actions">


                          <button className="cc-btn accept" disabled={correctionLoading === c.id}


                            onClick={(e) => { e.stopPropagation(); handleCorrection(c.id, "accept"); }}>


                            {correctionLoading === c.id ? "…" : "✓ Αποδοχή"}


                          </button>


                          <button className="cc-btn reject" disabled={correctionLoading === c.id}


                            onClick={(e) => { e.stopPropagation(); handleCorrection(c.id, "reject"); }}>


                            ✕ Απόρριψη


                          </button>


                        </div>


                      )}


                      {c.status === "accepted" && c.type === "fix" && (


                        <div style={{ paddingTop: 10, borderTop: "1px solid var(--rule-soft)" }}>


                          <button style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--mid)", cursor: "pointer" }}


                            onClick={(e) => {


                              e.stopPropagation();


                              setCorrections(prev => prev.map(x => x.id === c.id ? { ...x, status: "pending" } : x));


                              authFetch(`${API_URL}/api/correction-status/${sessionId}`, {


                                method: "POST", headers: { "Content-Type": "application/json" },


                                body: JSON.stringify({ correction_id: c.id, status: "pending" }),


                              }).catch(() => {});


                            }}>Αναίρεση</button>


                        </div>


                      )}


                    </div>


                  );


                })}


              </div>





              {step === "review" && counts.pending > 0 && (


                <div className="editor-corrections-foot">


                  <button className="cc-btn accept" onClick={acceptAll}>Αποδοχή όλων</button>


                  <button className="cc-btn reject" onClick={rejectAll}>Απόρριψη όλων</button>


                </div>


              )}


            </aside>


          </div>


        </div>


      )}





      {/* modals below — unchanged structure, just styling tokens updated */}





      {/* ========== DOWNLOAD MODAL ========== */}


      {showDownloadModal && verificationResult && (


        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,14,12,0.7)", backdropFilter: "blur(4px)" }}


          onClick={() => setShowDownloadModal(false)}>


          <div style={{ width: "100%", maxWidth: 500, margin: "0 24px", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: 32, background: "var(--surface)", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}


            onClick={e => e.stopPropagation()}>


            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>


              <h2 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 300, letterSpacing: "-0.02em" }}>Εξαγωγή</h2>


              <button onClick={() => setShowDownloadModal(false)} style={{ color: "var(--mid)", cursor: "pointer", fontSize: 16 }}>✕</button>


            </div>





            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>


              {[


                { label: "Πλήρες πακέτο (ZIP)", desc: "Original + Corrected + Report", fn: () => { downloadBundle(); setShowDownloadModal(false); }, primary: true },


                { label: "Αναφορά αλλαγών", desc: "HTML με όλες τις αλλαγές", fn: () => downloadReport() },


                { label: "Μόνο διορθωμένο", desc: verificationResult.is_safe ? "Εγκεκριμένες διορθώσεις" : "⚠ Μη εγκεκριμένες αλλαγές", fn: () => { downloadCorrected(); setShowDownloadModal(false); } },


                { label: "Αρχικό αρχείο", desc: "Πρωτότυπο άθικτο", fn: () => downloadOriginal() },


              ].map((opt, i) => (


                <button key={i} onClick={opt.fn}


                  style={{ padding: "14px 18px", border: `1px solid ${opt.primary ? "var(--accent)" : "var(--rule)"}`, borderRadius: "var(--r-sm)", textAlign: "left", background: opt.primary ? "var(--accent)" : "transparent", color: opt.primary ? "var(--bg)" : "var(--ink)", cursor: "pointer", transition: "all 0.25s" }}>


                  <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500 }}>{opt.label}</div>


                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, marginTop: 4, opacity: 0.7 }}>{opt.desc}</div>


                </button>


              ))}


              {corrections.some(c => c.status === "pending" && c.type === "fix") && (


                <button onClick={() => { window.open(downloadUrl(`/api/download/${sessionId}/tracked`), "_blank"); setShowDownloadModal(false); }}


                  style={{ padding: "14px 18px", border: "1px solid var(--amber)", borderRadius: "var(--r-sm)", textAlign: "left", background: "transparent", color: "var(--amber)", cursor: "pointer" }}>


                  <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500 }}>Track Changes για Word</div>


                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, marginTop: 4, opacity: 0.7 }}>Εκκρεμείς ως Track Changes</div>


                </button>


              )}


            </div>


          </div>


        </div>


      )}





      {/* ========== CUSTOM CORRECTION MODAL ========== */}


      {showCustomCorrectionModal && (


        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,14,12,0.7)", backdropFilter: "blur(4px)" }}


          onClick={() => setShowCustomCorrectionModal(false)}>


          <div style={{ width: "100%", maxWidth: 440, margin: "0 24px", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", padding: 32, background: "var(--surface)" }}


            onClick={e => e.stopPropagation()}>


            <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 24 }}>Χειροκίνητη διόρθωση</h2>


            <div style={{ marginBottom: 16 }}>


              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--mid)", marginBottom: 8 }}>Επιλεγμένο κείμενο</div>


              <div style={{ fontFamily: "var(--mono)", fontSize: 13, padding: "10px 14px", border: "1px solid var(--rust-soft)", borderRadius: "var(--r-xs)", color: "var(--rust)", background: "var(--rust-soft)" }}>


                {customCorrectionData.original}


              </div>


            </div>


            <div style={{ marginBottom: 24 }}>


              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--mid)", marginBottom: 8 }}>Αντικατάσταση (κενό για διαγραφή)</div>


              <Input value={customCorrectionData.suggested}


                onChange={(e) => setCustomCorrectionData(prev => ({ ...prev, suggested: e.target.value }))}


                placeholder="Νέο κείμενο ή κενό για διαγραφή" autoFocus


                style={{ fontFamily: "var(--mono)", borderColor: "var(--rule)" }} />


            </div>


            {error && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: "var(--r-xs)", background: "var(--rust-soft)", color: "var(--rust)", fontSize: 13 }}>{error}</div>}


            <div style={{ display: "flex", gap: 10 }}>


              <button className="cc-btn accept" onClick={handleCustomCorrectionSubmit} disabled={customCorrectionLoading}


                style={{ flex: 1 }}>{customCorrectionLoading ? "…" : customCorrectionData.suggested ? "Εφαρμογή" : "Διαγραφή"}</button>


              <button className="cc-btn reject" onClick={() => setShowCustomCorrectionModal(false)}>Ακύρωση</button>


            </div>


          </div>


        </div>


      )}





      {/* ========== DIFF PREVIEW MODAL ========== */}


      {showDiffPreviewModal && safetyData && (


        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,14,12,0.7)", backdropFilter: "blur(4px)" }}


          onClick={() => setShowDiffPreviewModal(false)}>


          <div style={{ width: "100%", maxWidth: 800, maxHeight: "90vh", margin: "0 24px", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}


            onClick={e => e.stopPropagation()}>


            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>


              <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 300, letterSpacing: "-0.02em" }}>Προεπισκόπηση αλλαγών</h2>


              <button onClick={() => setShowDiffPreviewModal(false)} style={{ color: "var(--mid)", cursor: "pointer" }}>✕</button>


            </div>


            <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--rule)", display: "flex", gap: 40 }}>


              {[


                { v: safetyData.original_chars?.toLocaleString(), l: "Αρχικοί χαρ." },


                { v: safetyData.working_chars?.toLocaleString(), l: "Τρέχοντες χαρ." },


                { v: `${safetyData.char_diff > 0 ? "+" : ""}${safetyData.char_diff?.toLocaleString()}`, l: "Diff" },


                { v: safetyData.matched_count, l: "Εγκεκριμένες" },


                { v: safetyData.unmatched_count, l: "Μη εγκεκριμένες" },


              ].map((s, i) => (


                <div key={i} style={{ textAlign: "center" }}>


                  <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 500, color: "var(--ink)" }}>{s.v}</div>


                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--mid)", marginTop: 4 }}>{s.l}</div>


                </div>


              ))}


            </div>


            <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>


              {safetyData.diff_preview?.length > 0 ? (


                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>


                  {safetyData.diff_preview.map((change, idx) => (


                    <div key={idx} style={{ padding: "12px 16px", border: `1px solid ${change.matched ? "var(--rule)" : "var(--rust)"}`, borderRadius: "var(--r-xs)", background: change.matched ? "transparent" : "var(--rust-soft)" }}>


                      <div style={{ fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.7, color: "var(--ink-soft)" }}>


                        <span style={{ color: "var(--mid-soft)" }}>{change.context_before}</span>


                        {change.original && <span style={{ color: "var(--rust)", textDecoration: "line-through", margin: "0 4px" }}>{change.original}</span>}


                        {change.new && <span style={{ color: "var(--accent)", fontWeight: 500, margin: "0 4px" }}>{change.new}</span>}


                        <span style={{ color: "var(--mid-soft)" }}>{change.context_after}</span>


                      </div>


                    </div>


                  ))}


                </div>


              ) : (


                <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "var(--display)", fontStyle: "italic", color: "var(--mid-soft)" }}>Δεν βρέθηκαν αλλαγές.</div>


              )}


            </div>


            <div style={{ padding: "16px 32px", borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "flex-end" }}>


              <button className="editor-pill" onClick={() => setShowDiffPreviewModal(false)}>Κλείσιμο</button>


            </div>


          </div>


        </div>


      )}





      <style>{`


        @keyframes spin { to { transform: rotate(360deg); } }


      `}</style>





      </div>


    </div>


  );


}


