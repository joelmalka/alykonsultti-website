export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS headers
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
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Step 1: Google Vision OCR
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: image },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    );

    const visionData = await visionResponse.json();

    if (!visionResponse.ok) {
      console.error('Vision API full response:', JSON.stringify(visionData));
      throw new Error(`Vision API error: ${visionData.error?.message || JSON.stringify(visionData)}`);
    }

    if (visionData.error) {
      throw new Error(`Vision API error: ${visionData.error.message}`);
    }

    const ocrText = visionData.responses[0]?.fullTextAnnotation?.text || '';

    if (!ocrText) {
      return res.status(200).json({
        ocrText: '',
        result: null,
        error: 'Tekstiä ei löytynyt kuvasta'
      });
    }

    // Step 2: Claude Analysis
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analysoi tämä kuitista/laskusta luettu teksti ja palauta tiedot JSON-muodossa.

KUITIN/LASKUN TEKSTI (OCR):
${ocrText}

TÄRKEÄÄ:
- Lue kaikki tiedot TARKASTI tekstistä, älä arvaa
- Suomen ALV-kannat 2024: 25,5% (yleinen), 14% (ruoka/ravintolat), 10% (kirjat/lääkkeet), 0%
- Jos tekstissä lukee ALV-prosentti, käytä SITÄ arvoa
- Yrityksen nimi pitää kirjoittaa TARKASTI kuten tekstissä lukee

Palauta VAIN JSON-objekti:
{
  "toimittaja": "Yrityksen nimi TARKASTI tekstistä",
  "summa": 123.45,
  "alv_prosentti": 14,
  "alv_summa": 15.16,
  "veroton_summa": 108.29,
  "paivamaara": "15.3.2025",
  "kuvaus": "Lyhyt kuvaus ostoksesta",
  "tiliointiehodus": "4000 - Ostot",
  "kululuokka": "Esim. Toimistotarvikkeet",
  "luottamus": "korkea/keskitaso/matala"
}

Vastaa VAIN JSON-objektilla.`
        }]
      })
    });

    const claudeData = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API full response:', JSON.stringify(claudeData));
      throw new Error(`Claude API error: ${claudeData.error?.message || claudeData.error?.type || JSON.stringify(claudeData)}`);
    }

    if (claudeData.error) {
      throw new Error(`Claude API error: ${claudeData.error.message}`);
    }

    if (!claudeData.content || !claudeData.content[0]) {
      throw new Error('Claude API returned empty response');
    }

    let resultText = claudeData.content[0].text;
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', resultText);
      throw new Error(`JSON parse error: ${parseError.message}`);
    }

    return res.status(200).json({
      ocrText,
      result
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Analysointi epäonnistui'
    });
  }
}
