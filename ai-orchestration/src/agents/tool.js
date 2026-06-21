import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";

// Helper to emit tool events
const emit = (config, tool, status, message, extra = {}) => {
    config.writer?.({
        type: "tool",
        tool,
        status,
        message,
        timestamp: Date.now(),
        ...extra,
    });
};

// Build the file tools bound to a specific sandbox base URL (per request).
export const createTools = (baseUrl) => {
    const listFiles = tool(
        async (_, config) => {
            emit(config, "list_files", "start", "Listing project files...");

            try {
                const response = await axios.get(`${baseUrl}/list-files`);

                emit(config, "list_files", "complete", "Done");
                return JSON.stringify(response.data.files);

                
            } catch (err) {
                emit(
                    config,
                    "list_files",
                    "error",
                    err.message
                );
                throw err;
            }
        },
        {
            name: "list_files",
            description:
                "List all files in the project directory.",
            schema: z.object({}),
        }
    );

    const readFiles = tool(
        async ({ files }, config) => {
            emit(
                config,
                "read_files",
                "start",
                `Reading ${files.length} file(s)...`,
                { files }
            );

            try {
                const response = await axios.get(`${baseUrl}/read-files`, {
                    params: { files: files.join(",") },
                });

                emit(
                    config,
                    "read_files",
                    "complete",
                    "Files read successfully.",
                    {
                        fileCount: files.length,
                    }
                );

                return JSON.stringify(response.data);
            } catch (err) {
                emit(
                    config,
                    "read_files",
                    "error",
                    err.message
                );
                throw err;
            }
        },
        {
            name: "read_files",
            description:
                "Read the contents of specified files.",
            schema: z.object({
                files: z
                    .array(z.string())
                    .describe(
                        "Paths of the files to read, relative to the project root (e.g. \"src/App.jsx\")."
                    ),
            }),
        }
    );

    const updateFiles = tool(
        async ({ files }, config) => {
            emit(
                config,
                "update_files",
                "start",
                `Updating ${files.length} file(s)...`,
                {
                    files: files.map((f) => f.file),
                }
            );

            try {
                const response = await axios.patch(
                    `${baseUrl}/update-files`,
                    {
                        updates: files,
                    }
                );

                emit(
                    config,
                    "update_files",
                    "complete",
                    `${files.length} file(s) updated successfully.`,
                    {
                        updatedFiles: files.map((f) => f.file),
                    }
                );

                return JSON.stringify(response.data.results);
            } catch (err) {
                emit(
                    config,
                    "update_files",
                    "error",
                    err.message
                );
                throw err;
            }
        },
        {
            name: "update_files",
            description:
                "Update existing files or create new ones if they don't exist.",
            schema: z.object({
                files: z.array(
                    z.object({
                        file: z
                            .string()
                            .describe(
                                "Relative path of the file."
                            ),
                        content: z
                            .string()
                            .describe("Updated file contents."),
                    })
                ),
            }),
        }
    );

    const createFile = tool(
        async ({ files }, config) => {
            emit(
                config,
                "create_file",
                "start",
                `Creating ${files.length} file(s)...`,
                {
                    files: files.map((f) => f.file),
                }
            );

            try {
                const response = await axios.post(
                    `${baseUrl}/create-files`,
                    {
                        files,
                    }
                );

                emit(
                    config,
                    "create_file",
                    "complete",
                    `${files.length} file(s) created successfully.`,
                    {
                        createdFiles: files.map((f) => f.file),
                    }
                );

                return JSON.stringify(response.data.results);
            } catch (err) {
                emit(
                    config,
                    "create_file",
                    "error",
                    err.message
                );
                throw err;
            }
        },
        {
            name: "create_file",
            description:
                "Create new files with specified content.",
            schema: z.object({
                files: z.array(
                    z.object({
                        file: z
                            .string()
                            .describe(
                                "Relative path of the new file."
                            ),
                        content: z
                            .string()
                            .describe(
                                "Contents of the new file."
                            ),
                    })
                ),
            }),
        }
    );

    return [
        listFiles,
        readFiles,
        updateFiles,
        createFile,
    ];
};