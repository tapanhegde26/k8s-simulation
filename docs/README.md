# Demo Assets

This folder contains demo assets for the README.

## Files

- `demo.gif` - Main demo GIF shown in README (create using the recording script)

## Creating the Demo GIF

1. Start the application:
   ```bash
   cd frontend && npm run dev
   ```

2. View recording instructions:
   ```bash
   ./scripts/record-demo.sh instructions
   ```

3. Record your screen (30-45 seconds) showing:
   - Cluster Architecture view
   - Architecture Flow animation
   - Pod Creation Flow animation

4. Save the recording as `docs/demo-recording.mp4`

5. Convert to optimized GIF:
   ```bash
   ./scripts/record-demo.sh convert
   ```

## Recommended Tools

- **macOS**: Kap (https://getkap.co) - can export directly to GIF
- **Cross-platform**: OBS Studio (https://obsproject.com)
- **Quick option**: macOS built-in (Cmd+Shift+5)
