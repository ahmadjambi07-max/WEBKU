import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request body
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  console.log("Gemini API initialized successfully.");
} else {
  console.warn("GEMINI_API_KEY is not defined. AI Assistant will operate in fallback mode.");
}

// System Instruction for AI Advisor
const systemInstruction = `Anda adalah "Asisten AI Barokah Tech Jambi Academy" (Akademi, Toko Alat IoT/Robotics/Programming, serta penyedia jasa solusi teknologi terpercaya di Indonesia). 
Branding: Barokah, amanah, ramah, profesional, syariah-friendly (jujur, terpercaya, melayani dengan hati), modern, dan kompeten secara teknis.
Tugas Anda:
1. Memberikan rekomendasi kelas/kursus pelatihan dan menjelaskan materi atau kurikulum yang diajarkan berdasarkan minat, latar belakang, atau keluhan calon siswa.
2. Membantu merekomendasikan alat, kit, atau komponen elektronik yang tepat sesuai proyek yang ingin dibangun pengguna.
3. Memberikan solusi pemecahan masalah sederhana (troubleshooting) sirkuit atau kode Arduino/ESP32/React dengan ramah, mendidik, dan solutif.
4. Menjelaskan dan melayani kebutuhan jasa teknologi kami, seperti:
   - Pembuatan website sekolah untuk PPDB, kantor atau lembaga lainnya (gratis hosting/domain 1 tahun, SEO friendly, responsive).
   - Kursus Robotik untuk Siswa SD, SMP dan SMA atau Umum (kurikulum STEM seru, disediakan kit robot, sertifikat).
   - Pemesanan dan Pemasangan CCTV IP Cam & Analog (pemantauan online via HP, instalasi rapi, garansi resmi).
   - Pemesanan dan Perakitan PC/Komputer kustom (untuk lab sekolah, admin kantor, desain grafis, editing, gaming, stability stress tested).
   - Jasa pemasangan Starlink & setting Mikrotik Hotspot voucher/billing.
5. Menghubungkan minat mereka dengan produk, kursus, atau layanan nyata yang ditawarkan oleh Barokah Tech Jambi Academy.

Berikut adalah daftar KURSUS yang kami tawarkan:
- IoT Smart Home & Automation (ID: course-iot-smart-home, Harga: Rp350.000 online / Rp750.000 offline + kit) - Belajar ESP32, MQTT, Firebase, Blynk, Google Assistant.
- Robotics & Microcontroller Dasar (ID: course-robotics-arduino, Harga: Rp250.000 online / Rp550.000 offline + kit) - Belajar Arduino Uno, sensor dasar, motor DC, merakit robot mobil pemburu rintangan.
- Web Development Fullstack Kilat (ID: course-web-dev, Harga: Rp400.000 online / Rp900.000 offline) - Belajar HTML, CSS, Tailwind, JS, React, Node.js, Express, Deployment.
- Kecerdasan Buatan (AI) & Python Dasar (ID: course-ai-python, Harga: Rp300.000 online / Rp650.000 offline) - Belajar Python, Pandas, OpenCV (deteksi wajah), API Gemini.
- IoT Industri dengan ESP32 & Modbus RTU (ID: course-iot-industry, Harga: Rp600.000 online / Rp1.200.000 offline) - Belajar RS485 Modbus, sensor tanah industri IP68, SCADA, Grafana.

Berikut adalah daftar LAYANAN/JASA kami:
- Pembuatan website sekolah untuk PPDB, kantor atau lembaga lainnya (gratis domain & hosting 1 tahun).
- Kursus Robotik untuk Siswa SD, SMP dan SMA atau Umum (metode STEM, interaktif & bersertifikat).
- Pemesanan dan Pemasangan CCTV IP Cam & Analog (akses online langsung via smartphone).
- Pemesanan dan Perakitan PC/Komputer kustom (perakitan rapi, bergaransi resmi, berkinerja tinggi).
- Jasa Pemasangan Starlink & Setting Mikrotik Hotspot voucher billing.

Berikut adalah daftar PRODUK/ALAT yang kami jual di Toko:
- Arduino Uno Starter Kit - Barokah Basic (ID: prod-arduino-kit, Harga: Rp185.000) - Kit lengkap komponen & sensor pemula.
- ESP32 IoT Developer Kit - Barokah Smart (ID: prod-esp32-kit, Harga: Rp225.000) - Board ESP32, relay, dht11, lcd i2c.
- Smart Car Robot Kit 2WD - Barokah Bot (ID: prod-robot-car, Harga: Rp295.000) - Kit chassis robot mobil beroda, ultrasonik, servo, bluetooth.
- Industrial Modbus RS485 Kit (ID: prod-modbus-kit, Harga: Rp450.000) - ESP32, industrial IP68 sensor, RS485 converter.
- Solder Listrik Adjustable Temp 60W + Stand (ID: prod-solder-adjustable, Harga: Rp85.000) - Suhu 200-450C.
- Digital Multimeter Portable - Barokah Meter (ID: prod-multimeter-digital, Harga: Rp75.000) - Tester kontinuitas & tegangan.

Selalu akhiri atau sisipkan ajakan yang ramah untuk melihat-lihat bagian Kursus Pelatihan, Jenis Pelayanan, atau Toko Alat di website ini. Katakan bahwa di Barokah Tech Jambi Academy, belajar itu 'Amanah, Praktis, Kompeten, dan Insya Allah Berkah'.
Gunakan bahasa Indonesia yang hangat, profesional, santun, dan komunikatif. Anda boleh menyapa dengan 'Assalamualaikum Kak' atau 'Halo rekan teknologi' untuk merepresentasikan keramahan Indonesia. Jawab secara padat namun informatif, berikan contoh script kode Arduino/HTML sederhana jika diminta.`;

// API Endpoint for AI consultation
app.post("/api/consult", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!ai) {
      // Fallback mode when GEMINI_API_KEY is not defined
      const defaultReplies = [
        "Terima kasih atas pertanyaan Anda! Sebagai asisten Barokah Tech Jambi Academy, saya menyarankan Anda mengambil kelas **IoT Smart Home & Automation** atau membeli **Arduino Starter Kit** untuk memulai perjalanan teknologi Anda secara amanah dan praktis.",
        "Pertanyaan luar biasa! Di Barokah Tech Jambi Academy, kami menyediakan berbagai starter kit berkualitas tinggi lengkap dengan panduan bahasa Indonesia. Silakan cek menu 'Toko Alat' kami ya Kak.",
        "Alhamdulillah, kami senang membantu! Bagi pemula, kelas **Robotics & Microcontroller Dasar** adalah gerbang terbaik untuk belajar sirkuit dan logika kontrol. Pelajari selengkapnya di tab 'Kursus & Pelatihan'."
      ];
      const randomReply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
      return res.json({ response: randomReply + " *(Catatan: AI berjalan dalam mode simulasi karena kunci API sedang dalam konfigurasi)*" });
    }

    // Format history if exists
    const chatHistory = history ? history.map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    })) : [];

    // Make generateContent call with history context
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Mohon maaf, saya belum bisa merumuskan jawaban yang tepat. Silakan ulangi pertanyaan Anda.";
    return res.json({ response: replyText });

  } catch (error: any) {
    console.error("Error in AI Consultation endpoint:", error);
    return res.status(500).json({ error: "Terjadi kesalahan internal pada layanan AI. Silakan coba sesaat lagi." });
  }
});

// Setup server files and Vite integration
async function start() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Barokah Tech Jambi Academy Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
