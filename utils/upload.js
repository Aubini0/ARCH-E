import multer from 'multer'

// Configure multer to save files to a directory on your server.
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads'); // Change 'uploads' to your desired directory.
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, file.fieldname + '-' + uniqueSuffix + '.mp3');
//     },
//   });

const storage = multer.memoryStorage(); // Store uploaded files in memory
export const upload = multer({ storage: storage });



  