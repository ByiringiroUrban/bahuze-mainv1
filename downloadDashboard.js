const axios = require("axios");
const fs = require("fs-extra");
const extract = require("extract-zip");
const path = require("path");

const DASHBOARD_URL = "https://github.com/ColorlibHQ/AdminLTE/archive/refs/heads/master.zip";
const ZIP_PATH = path.join(__dirname, "adminlte.zip");
const TEMP_DIR = path.join(__dirname, "temp_extract"); // Temporary extraction folder
const OUTPUT_DIR = path.join(__dirname, "public"); // Destination folder

async function downloadDashboard() {
    try {
        console.log("Downloading AdminLTE...");

        // Download the ZIP file
        const response = await axios({
            method: "GET",
            url: DASHBOARD_URL,
            responseType: "stream",
        });

        const writer = fs.createWriteStream(ZIP_PATH);
        response.data.pipe(writer);

        writer.on("finish", async () => {
            console.log("Download complete! Extracting...");

            // Ensure temp directory exists
            fs.ensureDirSync(TEMP_DIR);

            await extract(ZIP_PATH, { dir: TEMP_DIR });
            console.log("Extraction complete!");

            // Find extracted folder
            const extractedItems = fs.readdirSync(TEMP_DIR);
            console.log("Extracted files:", extractedItems);

            const extractedFolder = extractedItems.find(item => item.includes("AdminLTE"));

            if (extractedFolder) {
                console.log(`Moving contents of ${extractedFolder} to 'public'...`);

                const extractedPath = path.join(TEMP_DIR, extractedFolder);
                
                // Ensure public directory exists
                fs.ensureDirSync(OUTPUT_DIR);

                // Move files inside extracted folder to 'public'
                fs.copySync(extractedPath, OUTPUT_DIR, { overwrite: true });

                // Clean up temporary files
                fs.removeSync(TEMP_DIR);
                fs.unlinkSync(ZIP_PATH);

                console.log("Setup complete! Run `node server.js` to start.");
            } else {
                console.error("Error: Could not find extracted folder.");
            }
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

downloadDashboard();
