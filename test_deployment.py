"""
Test script to verify Render + Supabase deployment
"""
import requests
import json

# Production backend URL
BACKEND_URL = "https://codeguard-backend-g7ka.onrender.com"

def test_health_check():
    """Test if backend is running"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is running!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return False

def test_analysis():
    """Test code analysis endpoint"""
    print("\n🔍 Testing code analysis...")
    
    test_code = """
def calculate_discount(price, percent):
    discount = price * percent  # Bug: Should divide by 100
    return price - discount

result = calculate_discount(100, 20)
print(result)
"""
    
    payload = {
        "prompt": "Write a function to calculate discount",
        "code": test_code
    }
    
    try:
        print("   Sending request... (may take 30-50s on first request)")
        response = requests.post(
            f"{BACKEND_URL}/api/analyze",
            json=payload,
            timeout=90  # Allow time for cold start
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Analysis successful!")
            print(f"   Analysis ID: {data['analysis_id']}")
            print(f"   Bugs found: {len(data['bug_patterns'])}")
            print(f"   Severity: {data['overall_severity']}/10")
            print(f"   Summary: {data['summary'][:100]}...")
            return True, data['analysis_id']
        else:
            print(f"❌ Analysis failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            return False, None
    except requests.Timeout:
        print("❌ Request timed out (backend may be sleeping)")
        return False, None
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return False, None

def test_feedback(analysis_id):
    """Test feedback submission"""
    if not analysis_id:
        print("\n⚠️  Skipping feedback test (no analysis ID)")
        return
    
    print("\n🔍 Testing feedback submission...")
    
    payload = {
        "analysis_id": analysis_id,
        "rating": 5,
        "comment": "Test feedback from deployment script",
        "is_helpful": True
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/feedback",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Feedback submitted successfully!")
            data = response.json()
            print(f"   Feedback ID: {data['id']}")
            return True
        else:
            print(f"❌ Feedback failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Feedback submission failed: {e}")
        return False

def main():
    print("=" * 60)
    print("CodeGuard Deployment Test")
    print("Backend: Render.com + Supabase")
    print("Docker: Local (for now)")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ Health check failed. Stopping tests.")
        return
    
    # Test 2: Code analysis
    success, analysis_id = test_analysis()
    if not success:
        print("\n❌ Analysis failed. Stopping tests.")
        return
    
    # Test 3: Feedback
    test_feedback(analysis_id)
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    print("\n📋 Next Steps:")
    print("1. Press F5 in VS Code to test the extension")
    print("2. Open test_buggy_code.py")
    print("3. Enter a prompt and click 'Analyze Code'")
    print("4. Verify results appear in sidebar")
    print("5. Test feedback submission")
    print("\n⚠️  Note: First request takes 30-50 seconds (Render cold start)")

if __name__ == "__main__":
    main()
