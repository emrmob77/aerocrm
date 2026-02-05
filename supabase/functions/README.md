# Supabase Edge Functions

Bu klasor webhook akislari icin Edge Function kaynaklarini icerir.

## Fonksiyonlar

- `webhook-test`: test webhook gonderimi yapar.
- `webhook-dispatch`: event + data payload'ini hedef webhook URL'ine iletir.

## Lokal calistirma

```bash
supabase functions serve webhook-test --env-file .env.local
supabase functions serve webhook-dispatch --env-file .env.local
```

## Deploy

```bash
supabase functions deploy webhook-test
supabase functions deploy webhook-dispatch
```
