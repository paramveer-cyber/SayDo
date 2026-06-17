import { writeFile } from "node:fs/promises";
export async function writeData(content) {
    try {
        await writeFile("output.txt", content, "utf8");
        console.log("File written successfully.");
    }
    catch (err) {
        console.error("Error writing file:", err);
    }
}
//# sourceMappingURL=writeToFile.js.map