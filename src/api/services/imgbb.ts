import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import fetch from 'node-fetch';

import { IMGBB_KEY } from '../../env';

export async function upload(image: UploadedFile): Promise<string> {
  const form = new FormData();
  form.append('image', image.data, 'img');

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    headers: {
      ...form.getHeaders(),
    },
    body: form,
    method: 'POST',
  });

  const json = await res.json();

  return json.data.url;
}
