import dotenv from 'dotenv';
dotenv.config();

import { processImageUpload } from '../services/upload.service.js';

async function testCloudinary() {
  console.log('🧪 Test de connexion et d\'upload vers Cloudinary...');
  console.log(`Cloud Name configuré: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`API Key configurée: ${process.env.CLOUDINARY_API_KEY ? '******' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NON'}`);

  // Image de test 1x1 pixel PNG en base64
  const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  try {
    const result = await processImageUpload(
      { image: testBase64, folder: 'test_validation' },
      'localhost:5000',
      { email: 'test.admin@tfarhida.tn' }
    );

    console.log('\n--- RÉSULTAT DU TEST ---');
    console.log('Fournisseur retourné :', result.provider);
    console.log('URL générée          :', result.url);

    if (result.provider === 'cloudinary') {
      console.log('\n🎉 SUCCÈS ! Cloudinary est parfaitement configuré et opérationnel !');
      console.log('L\'URL inclut l\'optimisation auto :', result.url.includes('f_auto,q_auto') ? 'OUI ✅' : 'NON ❌');
    } else {
      console.log('\n⚠️ ATTENTION : L\'image a été sauvegardée en LOCAL au lieu de Cloudinary.');
    }
  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST CLOUDINARY :', error.message);
  }
}

testCloudinary();
