// Test Chat Persistence - Run in browser console

(async () => {
  console.log('=== Testing Chat Persistence ===\n');
  
  // Get current user from store
  const userId = localStorage.getItem('abfi_anon_uid');
  console.log('Current user ID:', userId);
  
  if (!userId) {
    console.error('❌ No user ID found! Chat will not work.');
    return;
  }
  
  // Test direct API insert
  console.log('\n1. Testing direct Supabase insert...');
  
  const testMessage = {
    inlet_id: 'ny-shinnecock',
    user_id: userId,
    text: `Test message from console - ${new Date().toLocaleTimeString()}`
  };
  
  try {
    const response = await fetch('/api/test-chat-insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Message inserted:', result);
    } else {
      console.error('❌ Insert failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
  
  // Read back messages
  console.log('\n2. Reading messages from chat_messages table...');
  
  try {
    const response = await fetch('/api/test-chat-read?inlet_id=ny-shinnecock');
    
    if (response.ok) {
      const messages = await response.json();
      console.log(`✅ Found ${messages.length} messages`);
      if (messages.length > 0) {
        console.log('Latest message:', messages[0]);
      }
    } else {
      console.error('❌ Read failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
  
  console.log('\n3. Check if optimistic updates are working:');
  console.log('- Type a message in chat');
  console.log('- It should appear instantly (gray/italic)');
  console.log('- Then turn solid when saved');
  console.log('- Check Network tab for chat_messages insert');
})();
