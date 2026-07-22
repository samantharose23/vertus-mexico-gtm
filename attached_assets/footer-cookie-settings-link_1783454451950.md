# "Cookie Settings" reopen link

GDPR expects visitors to be able to change their mind later. Add a link
(usually in the footer) that reopens the banner with the preferences panel
expanded. The banner listens for a window `open-cookie-settings` CustomEvent.

## React

```tsx
<a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-cookie-settings"));
  }}
  data-testid="link-footer-cookie-settings"
>
  Cookie Settings
</a>
```

## Plain HTML

```html
<a href="#" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('open-cookie-settings'));">
  Cookie Settings
</a>
```
