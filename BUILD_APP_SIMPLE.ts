/**
 * SIMPLIFIED generateReactViteApp function
 * Generates app-specific onboarding form instead of generic multi-step wizard
 */

function getAppSpecificFormFields(appIdea: string, targetUser: string): { title: string; fields: string } {
  const lowerIdea = appIdea.toLowerCase()

  // Letters/Messages app
  if (lowerIdea.includes('letter') || lowerIdea.includes('message') || lowerIdea.includes('grandpar')) {
    return {
      title: 'Send a Message',
      fields: `
        <div class="form-group">
          <label for="sender">Who is sending this message?</label>
          <input type="text" id="sender" name="sender" placeholder="Your name" required>
        </div>
        <div class="form-group">
          <label for="recipient">Who is it going to?</label>
          <input type="text" id="recipient" name="recipient" placeholder="Recipient name" required>
        </div>
        <div class="form-group">
          <label for="message">Your message</label>
          <textarea id="message" name="message" placeholder="Write your message..." required></textarea>
        </div>
      `
    }
  }

  // Task/Todo app
  if (lowerIdea.includes('task') || lowerIdea.includes('todo') || lowerIdea.includes('list')) {
    return {
      title: 'Add a Task',
      fields: `
        <div class="form-group">
          <label for="task">What do you need to do?</label>
          <input type="text" id="task" name="task" placeholder="Task description" required>
        </div>
        <div class="form-group">
          <label for="priority">Priority level</label>
          <select id="priority" name="priority" required>
            <option value="">Select priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="form-group">
          <label for="duedate">Due date (optional)</label>
          <input type="date" id="duedate" name="duedate">
        </div>
      `
    }
  }

  // Fitness/Workout app
  if (lowerIdea.includes('workout') || lowerIdea.includes('fitness') || lowerIdea.includes('exercise')) {
    return {
      title: 'Log Your Workout',
      fields: `
        <div class="form-group">
          <label for="exercise">What did you do?</label>
          <input type="text" id="exercise" name="exercise" placeholder="e.g., Running, Weight lifting, Yoga" required>
        </div>
        <div class="form-group">
          <label for="duration">Duration (minutes)</label>
          <input type="number" id="duration" name="duration" placeholder="30" required>
        </div>
        <div class="form-group">
          <label for="intensity">How intense?</label>
          <select id="intensity" name="intensity" required>
            <option value="">Select intensity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      `
    }
  }

  // Finance/Budget app
  if (lowerIdea.includes('budget') || lowerIdea.includes('expense') || lowerIdea.includes('money') || lowerIdea.includes('finance')) {
    return {
      title: 'Add a Transaction',
      fields: `
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" name="category" required>
            <option value="">Select category</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="bills">Bills</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="amount">Amount ($)</label>
          <input type="number" id="amount" name="amount" placeholder="0.00" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="description">What was this for?</label>
          <input type="text" id="description" name="description" placeholder="Description" required>
        </div>
      `
    }
  }

  // Review/Rating app
  if (lowerIdea.includes('review') || lowerIdea.includes('rating') || lowerIdea.includes('feedback')) {
    return {
      title: 'Leave a Review',
      fields: `
        <div class="form-group">
          <label for="itemname">What are you reviewing?</label>
          <input type="text" id="itemname" name="itemname" placeholder="Product or service name" required>
        </div>
        <div class="form-group">
          <label for="rating">Rating</label>
          <select id="rating" name="rating" required>
            <option value="">Select rating</option>
            <option value="5">★★★★★ Excellent</option>
            <option value="4">★★★★ Good</option>
            <option value="3">★★★ Average</option>
            <option value="2">★★ Poor</option>
            <option value="1">★ Terrible</option>
          </select>
        </div>
        <div class="form-group">
          <label for="review">Your review</label>
          <textarea id="review" name="review" placeholder="Share your thoughts..." required></textarea>
        </div>
      `
    }
  }

  // Default fallback
  return {
    title: 'Submit Your Input',
    fields: `
      <div class="form-group">
        <label for="input1">Tell us something</label>
        <input type="text" id="input1" name="input1" placeholder="Enter your input..." required>
      </div>
      <div class="form-group">
        <label for="input2">Additional details</label>
        <textarea id="input2" name="input2" placeholder="Share more..." required></textarea>
      </div>
    `
  }
}

function generateReactViteApp(
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string,
  openaiKey?: string
): Array<{ path: string; content: string }> {
  const { title: formTitle, fields: formFields } = getAppSpecificFormFields(appIdea, targetUser)

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 20px; 
    }
    .container { 
      max-width: 600px; 
      width: 100%; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
      overflow: hidden; 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 { 
      font-size: 2em; 
      font-weight: 700; 
      margin-bottom: 8px; 
    }
    .header p { 
      font-size: 1.05em; 
      opacity: 0.95; 
      margin: 0; 
    }
    .main { 
      padding: 40px 30px; 
    }
    .form-title { 
      font-size: 1.5em; 
      color: #333; 
      margin-bottom: 24px; 
      font-weight: 600; 
    }
    .form-group { 
      margin-bottom: 20px; 
    }
    .form-group label { 
      display: block; 
      color: #333; 
      font-weight: 500; 
      margin-bottom: 8px; 
    }
    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group input[type="date"],
    .form-group select,
    .form-group textarea { 
      width: 100%; 
      padding: 12px; 
      border: 2px solid #e0e0e0; 
      border-radius: 8px; 
      font-family: inherit; 
      font-size: 1em; 
      transition: border-color 0.2s; 
    }
    .form-group textarea { 
      resize: vertical; 
      min-height: 100px; 
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus { 
      outline: none; 
      border-color: #667eea; 
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); 
    }
    .btn-submit { 
      width: 100%; 
      padding: 12px; 
      background: linear-gradient(135deg, #00c853 0%, #1de9b6 100%); 
      color: white; 
      border: none; 
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 1em; 
      cursor: pointer; 
      transition: all 0.2s; 
      margin-top: 20px; 
    }
    .btn-submit:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 5px 15px rgba(0, 200, 83, 0.3); 
    }
    .success-message { 
      display: none; 
      text-align: center; 
      padding: 40px 20px; 
    }
    .success-message h2 { 
      color: #00c853; 
      font-size: 1.8em; 
      margin-bottom: 12px; 
    }
    .success-message p { 
      color: #666; 
      margin-bottom: 12px; 
    }
    @media (max-width: 600px) { 
      .header h1 { font-size: 1.5em; } 
      .main { padding: 20px; } 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
      <p>${appIdea}</p>
    </div>
    <div class="main">
      <form id="appForm" onsubmit="handleSubmit(event)">
        <h2 class="form-title">${formTitle}</h2>
        ${formFields}
        <button type="submit" class="btn-submit">Submit</button>
      </form>
      <div class="success-message" id="successMessage">
        <h2>✓ Submitted!</h2>
        <p>Thank you for using ${appName}</p>
        <p style="color: #999; font-size: 0.9em; margin-top: 20px;">Want to submit again? Refresh the page.</p>
      </div>
    </div>
  </div>

  <script>
    function handleSubmit(event) {
      event.preventDefault()
      document.getElementById('appForm').style.display = 'none'
      document.getElementById('successMessage').style.display = 'block'
    }
  </script>
</body>
</html>`

  return [
    {
      path: 'index.html',
      content: htmlContent,
    },
  ]
}
