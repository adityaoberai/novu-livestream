import { OpenAIApi, Configuration } from 'openai';
import { getStaticFile, throwIfMissing } from './utils.js';
import { Client, Databases, ID } from 'node-appwrite'

export default async ({ req, res, log, error }) => {

  const client = new Client();
  client.setEndpoint("https://cloud.appwrite.io/v1");
  client.setProject("652808f8255d1c6f65de");
  client.setKey(process.env.Appwrite_Api_Key);


  throwIfMissing(process.env, ['OPENAI_API_KEY']);

  if (req.method === 'GET') {
    return res.send(getStaticFile('index.html'), 200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
  }

  try {
    throwIfMissing(req.body, ['prompt']);
  } catch (err) {
    return res.json({ ok: false, error: err.message }, 400);
  }

  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
  );

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '512'),
      messages: [{ role: 'user', content: req.body.prompt }],
    });
    const completion = response.data.choices[0].message?.content;
    log(completion);

    var db = new Databases(client);

    db.createDocument(
      "65280ff09154f456ef18",
      "65281003049729eb3b0d",
      ID.unique(),
      {
        prompt: req.body.prompt,
        completion: completion
      }
    )

    return res.json({ ok: true, completion }, 200);
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: 'Failed to query model.' }, 500);
  }
};
