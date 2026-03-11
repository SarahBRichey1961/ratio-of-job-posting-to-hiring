# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - button "← Back" [ref=e6] [cursor=pointer]
        - heading "Take The Reins" [level=1] [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "Login" [level=2] [ref=e10]
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e13]: Email
            - textbox "your@email.com" [ref=e14]: test@example.com
          - generic [ref=e15]:
            - generic [ref=e16]: Password
            - textbox "••••••••" [ref=e17]: Test123456!
          - button "Logging in..." [disabled] [ref=e18]
        - paragraph [ref=e20]:
          - text: Don't have an account?
          - link "Sign up" [ref=e21] [cursor=pointer]:
            - /url: /auth/signup
      - generic [ref=e22]:
        - paragraph [ref=e23]: Or create an account to get started
        - paragraph [ref=e24]: Sign up to manage multiple manifestos, track edits, and access your account from anywhere.
  - alert [ref=e25]
```