export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const SYSTEM_PROMPT = `Olet siivousfirman asiakaspalvelubotti. Tehtäväsi on kerätä tietoja asiakkaan siivoustarpeesta.

Sinun tulee selvittää:
1. Minkälainen siivouspalvelu (kotisiivous, toimistosiivous, muuttosiivous, ikkunanpesu, perussiivous, muu)
2. Kohteen tyyppi (asunto, omakotitalo, toimisto, liiketila)
3. Kohteen koko neliömetreinä (noin arvio riittää)
4. Toistuvuus (kertaluontoinen, viikoittain, joka toinen viikko, kuukausittain)
5. Missä kohde sijaitsee (osoite/paikkakunta)
6. Erityistoiveet tai lisätiedot
7. Asiakkaan yhteystiedot (nimi, puhelin, sähköposti)

Ole ystävällinen, ammattimainen ja tehokas. Kysy yksi tai kaksi asiaa kerrallaan, älä kaikkea samalla.

Kun olet saanut kaikki tiedot, tee yhteenveto ja kerro että siivouspalvelu ottaa yhteyttä pian tarjouksen kanssa.

Mainitse tarvittaessa, että hinnat vaihtelevat kohteen koon ja siivoustyypin mukaan.

Vastaa aina suomeksi. Ole ytimekäs ja ystävällinen.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    const claudeData = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API error:', claudeData);
      throw new Error(claudeData.error?.message || 'Claude API error');
    }

    const reply = claudeData.content[0].text;

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Chat failed'
    });
  }
}
