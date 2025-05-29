// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.getElementById('submitQuestion').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  const questionInput = document.getElementById('questionInput').value.trim();
  const answerOutput = document.getElementById('answerOutput');

  // Clear previous answer
  answerOutput.innerHTML = 'Processing...';

  if (!fileInput.files.length || !questionInput) {
    answerOutput.innerHTML = 'Please upload at least one file and enter a question.';
    return;
  }

  let extractedText = '';

  // Process each uploaded file
  for (const file of fileInput.files) {
    try {
      if (file.type === 'application/pdf') {
        extractedText += await extractTextFromPDF(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        extractedText += await extractTextFromWord(file);
      } else {
        extractedText += `Unsupported file type: ${file.name}\n`;
      }
    } catch (error) {
      console.error('Error processing file:', error);
      extractedText += `Error processing ${file.name}: ${error.message}\n`;
    }
  }

  // Generate answer based on extracted text and question
  const answer = generateAnswer(questionInput, extractedText);
  answerOutput.innerHTML = answer || 'No relevant information found in the files.';
});

// Extract text from PDF using pdf.js
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }

  return text;
}

// Extract text from Word document using mammoth.js
async function extractTextFromWord(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Simple keyword-based answer generation (mock AI)
function generateAnswer(question, text) {
  // Convert question and text to lowercase for case-insensitive matching
  const questionWords = question.toLowerCase().split(/\s+/);
  const textWords = text.toLowerCase().split(/\s+/);

  // Find matching words
  const matches = questionWords.filter(word => textWords.includes(word));
  if (matches.length === 0) {
    return null; // No relevant content found
  }

  // Extract a snippet around the first match (simulating context)
  const matchIndex = textWords.indexOf(matches[0]);
  const start = Math.max(0, matchIndex - 20);
  const end = Math.min(textWords.length, matchIndex + 20);
  const snippet = textWords.slice(start, end).join(' ');

  return `Based on the files, I found: "${snippet}"`;
}
