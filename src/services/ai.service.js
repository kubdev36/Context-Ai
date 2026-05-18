const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";

const BASE_SYSTEM_PROMPT = `
Bạn là trợ lý đọc hiểu tiếng Việt có nhiệm vụ bám sát văn bản gốc.

Nguyên tắc bắt buộc:
- Chỉ sử dụng thông tin có trong nội dung được cung cấp.
- Không thêm ý suy diễn, không bịa chi tiết, không chèn kiến thức ngoài bài.
- Nếu bài không đủ thông tin, phải nói rõ là không đủ thông tin.
- Ưu tiên độ chính xác nội dung hơn văn phong hoa mỹ.
- Giữ nguyên tên riêng, số liệu, mốc thời gian, thuật ngữ quan trọng nếu có.
`.trim();

const limitContent = (content, maxLength = 12000) => {
  if (!content) return "";
  return content.slice(0, maxLength);
};

const createOllamaError = (message, status = 500, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
};

const callOllama = async (prompt, options = {}) => {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      system: options.system || BASE_SYSTEM_PROMPT,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.2,
        top_p: options.topP ?? 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 404 && errorText.includes("not found")) {
      throw createOllamaError(
        `Ollama model "${MODEL}" was not found. Pull it first with: ollama pull ${MODEL}`,
        502,
        errorText
      );
    }

    throw createOllamaError(
      `Ollama request failed with status ${response.status}`,
      502,
      errorText
    );
  }

  const data = await response.json();
  return data.response?.trim() || "";
};

export const summarizeContent = async ({ title, url, content }) => {
  const safeContent = limitContent(content);

  return callOllama(
    `
Hãy tóm tắt bài đọc dưới đây.

Thông tin trang:
Title: ${title || "Không có title"}
URL: ${url || "Không có URL"}

Nội dung:
${safeContent}

Yêu cầu đầu ra:
- Viết bằng tiếng Việt.
- Tóm tắt đúng ý gốc, không thêm nhận định ngoài bài.
- Chỉ nêu các ý thực sự xuất hiện trong nội dung.
- Nếu bài có số liệu, mốc thời gian, tên riêng hoặc kết luận quan trọng, giữ lại chính xác.
- Trình bày 5-7 gạch đầu dòng ngắn gọn.
- Dòng cuối cùng thêm mục: "Do tin cậy theo nguồn: cao / trung bình / thấp", dựa trên độ đầy đủ của nội dung được cung cấp.
`.trim(),
    {
      temperature: 0.1,
    }
  );
};

export const translateContent = async ({ content, targetLanguage }) => {
  const safeContent = limitContent(content, 8000);
  const isVietnameseTarget = String(targetLanguage).trim().toLowerCase() === "vietnamese";
  const translationInstruction = isVietnameseTarget
    ? "Hãy dịch toàn bộ nội dung sau sang tiếng Việt."
    : `Hãy dịch nội dung sau sang ${targetLanguage}.`;

  return callOllama(
    `
${translationInstruction}

Yêu cầu đầu ra:
- Dịch sát nghĩa, không lược bớt ý quan trọng.
- Không tự diễn giải thêm nội dung mới.
- Giữ đúng tên riêng, số liệu, thuật ngữ, ngày tháng, đơn vị đo.
- Nếu gặp cụm khó dịch, ưu tiên bảo toàn nghĩa gốc hơn làm đẹp câu.
- Chỉ trả về bản dịch, không giải thích thêm.
${isVietnameseTarget ? "- Bản dịch cuối cùng phải hoàn toàn bằng tiếng Việt." : ""}

Nội dung:
${safeContent}
`.trim(),
    {
      temperature: 0.1,
    }
  );
};

export const explainContent = async ({ content }) => {
  const safeContent = limitContent(content);

  return callOllama(
    `
Hãy giải thích nội dung sau bằng tiếng Việt cho người mới bắt đầu.

Yêu cầu đầu ra:
- Dễ hiểu nhưng vẫn bám sát nội dung gốc.
- Không thêm thông tin ngoài bài như thể đó là sự thật có trong bài.
- Nếu dùng ví dụ minh họa, phải ghi rõ đó là ví dụ minh họa chứ không phải nội dung gốc.
- Nếu bài có thuật ngữ, giải thích ngắn gọn các thuật ngữ đó.

Nội dung:
${safeContent}
`.trim(),
    {
      temperature: 0.2,
    }
  );
};

export const askAboutContent = async ({ title, url, content, question }) => {
  const safeContent = limitContent(content);

  return callOllama(
    `
Hãy trả lời câu hỏi của người dùng dựa hoàn toàn trên bài đọc.

Title: ${title || "Không có title"}
URL: ${url || "Không có URL"}

Nội dung trang:
${safeContent}

Câu hỏi:
${question}

Yêu cầu đầu ra:
- Chỉ dùng thông tin có trong nội dung trang.
- Nếu không đủ dữ kiện để trả lời chắc chắn, nói rõ phần nào thiếu.
- Trả lời bằng tiếng Việt, ngắn gọn và trực tiếp.
`.trim(),
    {
      temperature: 0.1,
    }
  );
};
