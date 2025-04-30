import { connectDB } from '../config/connector';
import Music from '../models/Music';

async function migrateMusic() {
  try {
    await connectDB();
    
    // Finde alle alten Musik-Einträge
    const oldMusic = await Music.find({ urls: { $exists: true } });
    
    console.log(`Gefundene alte Einträge: ${oldMusic.length}`);
    
    // Konvertiere jeden Eintrag
    for (const entry of oldMusic) {
      const urls = entry.urls || [];
      
      // Erstelle für jede URL einen neuen Eintrag
      for (const url of urls) {
        await Music.findOneAndUpdate(
          { url },
          { url },
          { upsert: true }
        );
      }
      
      // Lösche den alten Eintrag
      await Music.deleteOne({ _id: entry._id });
    }
    
    console.log('Migration abgeschlossen');
  } catch (error) {
    console.error('Fehler bei der Migration:', error);
  } finally {
    process.exit();
  }
}

migrateMusic(); 