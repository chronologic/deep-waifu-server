import { UploadedFile } from 'express-fileupload';
import FormData from 'form-data';
import fetch from 'node-fetch';

import { MODEL_URL } from '../../env';

export async function selfie2anime(selfie: UploadedFile): Promise<any> {
  const form = new FormData();
  form.append('file', selfie.data, 'selfie');

  const res = await fetch(`${MODEL_URL}/selfie2anime`, {
    headers: {
      ...form.getHeaders(),
    },
    body: form,
    method: 'POST',
  });

  const buf = await res.buffer();

  return buf;
}
