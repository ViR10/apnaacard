const mongoose = require('mongoose');

let cachedConnection = null;
let gfs = null;
let gridfsBucket = null;

async function connectDB() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return { connection: cachedConnection, gfs, gridfsBucket };
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 5, // Maintain up to 5 socket connections
            serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false // Disable mongoose buffering
        });

        cachedConnection = connection;

        // Initialize GridFS
        gridfsBucket = new mongoose.mongo.GridFSBucket(connection.connection.db, {
            bucketName: 'uploads'
        });

        // For backward compatibility with older gridfs-stream
        const Grid = require('gridfs-stream');
        gfs = Grid(connection.connection.db, mongoose.mongo);
        gfs.collection('uploads');

        console.log('MongoDB Connected:', connection.connection.host);
        return { connection: cachedConnection, gfs, gridfsBucket };
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// Helper function to upload buffer to GridFS
async function uploadToGridFS(buffer, filename, contentType) {
    const { gridfsBucket } = await connectDB();
    
    return new Promise((resolve, reject) => {
        const uploadStream = gridfsBucket.openUploadStream(filename, {
            contentType: contentType
        });

        uploadStream.on('error', reject);
        uploadStream.on('finish', (file) => {
            resolve({
                id: file._id,
                filename: file.filename,
                contentType: file.contentType,
                size: file.length,
                uploadDate: file.uploadDate
            });
        });

        uploadStream.end(buffer);
    });
}

// Helper function to get file from GridFS
async function getFromGridFS(filename) {
    const { gridfsBucket } = await connectDB();
    
    return new Promise((resolve, reject) => {
        const downloadStream = gridfsBucket.openDownloadStreamByName(filename);
        const chunks = [];

        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        downloadStream.on('error', reject);
    });
}

// Helper function to delete file from GridFS
async function deleteFromGridFS(filename) {
    const { gfs } = await connectDB();
    
    return new Promise((resolve, reject) => {
        gfs.files.findOne({ filename }, (err, file) => {
            if (err) return reject(err);
            if (!file) return resolve({ message: 'File not found' });

            gfs.files.deleteOne({ _id: file._id }, (err) => {
                if (err) return reject(err);
                resolve({ message: 'File deleted successfully' });
            });
        });
    });
}

module.exports = {
    connectDB,
    uploadToGridFS,
    getFromGridFS,
    deleteFromGridFS
};
