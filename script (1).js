document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const questionInput = document.getElementById('questionInput');
  const submitQuestion = document.getElementById('submitQuestion');
  const answerOutput = document.getElementById('answerOutput');
  let fileContents = [];

  // Handle file uploads
  fileInput.addEventListener('change', async (event) => {
    fileContents = []; // Reset content on new upload
    const files = event.target.files;

    for (const file of files) {
      if (file.type === 'text/plain') {
        const text = await file.text();
        fileContents.push({ name: file.name, content: text.toLowerCase() });
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + ' ';
        }
        fileContents.push({ name: file.name, content: text.toLowerCase() });
      }
    }
    answerOutput.innerHTML = `<p class="text-green-600">Files uploaded successfully: ${fileContents.map(f => f.name).join(', ')}</p>`;
  });

  // Handle question submission
  submitQuestion.addEventListener('click', () => {
    const question = questionInput.value.trim().toLowerCase();
    if (!question) {
      answerOutput.innerHTML = '<p class="text-red-600">Please enter a question.</p>';
      return;
    }
    if (fileContents.length === 0) {
      answerOutput.innerHTML = '<p class="text-red-600">No files uploaded. Please upload files to get answers.</p>';
      return;
    }

    // Simple keyword-based search
    let answer = '';
    const keywords = question.split(/\s+/);
    for (const file of fileContents) {
      let relevantText = '';
      for (const keyword of keywords) {
        if (file.content.includes(keyword)) {
          // Extract a snippet around the keyword (100 characters before and after)
          const index = file.content.indexOf(keyword);
          const start = Math.max(0, index - 100);
          const end = Math.min(file.content.length, index + keyword.length + 100);
          relevantText += file.content.slice(start, end) + ' ... ';
        }
      }
      if (relevantText) {
        answer += `<p><strong>From ${file.name}:</strong> ${relevantText}</p>`;
      }
    }

    if (answer) {
      answerOutput.innerHTML = `<p class="text-gray-800">${answer}</p>`;
    } else {
      answerOutput.innerHTML = '<p class="text-red-600">Sorry, I couldn’t find an answer in the uploaded files.</p>';
    }
  });
});
