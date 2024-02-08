import { diskStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const multerOptions: MulterOptions = {
	storage: diskStorage({
		destination: './public',
		filename: (req, file, cb) => {
			const filename = `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`;
			cb(null, filename);
		},
	}),
};
