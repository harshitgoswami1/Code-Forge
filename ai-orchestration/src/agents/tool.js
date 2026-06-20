import axios from 'axios';
import { tool } from "langchain"
import * as z from "zod";

// Build the file tools bound to a specific sandbox base URL (per request).
export const createTools = (baseUrl) => {
    const listFiles = tool(
        async ({}) => {
            console.log("=================================")
            console.log("using list files tool", baseUrl)
            console.log("=================================")

            const response = await axios.get(`${baseUrl}/list-files`)

            console.log("=================================")
            console.log("response from list files tool", response.data)
            console.log("=================================")

            return JSON.stringify(response.data.files);
        },
        {
            name: "list_files",
            description: "List all the files in the project directory. This is useful for understanding what files are available to work with.",
            schema: z.object({})
        }
    )

    const readFiles = tool(
        async ({ files }) => {
            console.log("=================================")
            console.log("using read files tool with files", files)
            console.log("=================================")

            const response = await axios.get(`${baseUrl}/read-files?files=` + files.join(","))

            console.log("=================================")
            console.log("response from read files tool", response.data)
            console.log("=================================")
            return JSON.stringify(response.data);
        },
        {
            name: "read_files",
            description: "Read the contents of specified files. This is useful for understanding the content of files that are relevant to the task at hand.",
            schema: z.object({
                files: z.array(z.string()).describe("The list of files absolute paths to read. These should be files that were listed using the list_files tool or created later")
            })
        }
    )

    const updateFiles = tool(
        async ({ files }) => {
            console.log("=================================")
            console.log("using update files tool with files", files)
            console.log("=================================")

            const response = await axios.patch(`${baseUrl}/update-files`, {
                updates: files
            })
            console.log("=================================")
            console.log("response from update files tool", response.data)
            console.log("=================================")

            return JSON.stringify(response.data.results);
        },
        {
            name: "update_files",
            description: "Update the contents of specified files. This is useful for making changes to files based on the requirements of the task at hand. this tool can also use to create new files by providing a new file name in the file field and the content to be added in the content field.",
            schema: z.object({
                files: z.array(z.object({
                    file: z.string().describe("The relative path of the file to update, e.g. src/App.jsx"),
                    content: z.string().describe("The new content for the file, the content should support json format.")
                })).describe("The list of files to update and their new contents")
            })
        }
    )

    const createFile = tool(
        async ({ files }) => {
            console.log("=================================")
            console.log("using create file tool with files", files)
            console.log("=================================")

            const response = await axios.post(`${baseUrl}/create-files`, {
                files
            })

            console.log("=================================")
            console.log("response from create file tool", response.data)
            console.log("=================================")

            return JSON.stringify(response.data.results);
        },
        {
            name: "create_file",
            description: "Create new files with specified content. Use this to create files that do not yet exist in the project directory.",
            schema: z.object({
                files: z.array(z.object({
                    file: z.string().describe("The relative path of the file to create, e.g. src/utils/helper.js"),
                    content: z.string().describe("The content to write into the new file")
                })).describe("The list of files to create and their contents")
            })
        }
    )

    return [listFiles, readFiles, updateFiles, createFile];
}
