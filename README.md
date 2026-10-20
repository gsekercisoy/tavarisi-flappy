# Tavarişi Flappy

React (Vite) canvas oyunu + Java (Spring Boot 2.7) REST API + H2 veritabanı.
Uçuş fizik tarayıcıda; rekor skorlar sunucuda `scores` tablosunda tutulur.

## Özellikler

- Kendi çizimli kuş/kuş/boru: yatık açı, kanat animasyonu, gölge kapaklı yeşil borular
- Yerçekimi + zıplama fiziği; borular geçtikçe hız artar (128 → 210 px/s)
- Kontrol: Boşluk / ▲ / W / tıkla (dokunmatik uyumlu)
- Oyun sonu adla **skor sunucuya** kaydedilir (doğrulamalı: skor 0-100000, ad 1-20 karakter)
- **Skor tablosu API'den** top-10; 10 saniyede bir öz yenileme + kayıt sonrası anında tazeleme
- Oyuncu başına en iyi 5 uçuş: `GET /api/scores/{player}`

## Çalıştırma

```bash
cd backend && mvn spring-boot:run        # API :8080
cd frontend && npm install && npm run dev  # UI :5173 (proxy → 8080)
```

## API

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/scores` | Top-10 skor |
| POST | `/api/scores` | `{player, score, pipes}` — skor kaydet → 201 |
| GET | `/api/scores/{player}` | Oyuncunun en iyi 5 uçuşu + oyun sayısı |
| GET | `/api/stats` | `{totalGames, bestScore, top}` |
