#!/bin/bash

# =============================================================================
# Demo GIF Recording Script for K8s Simulation
# =============================================================================
#
# This script helps you record a demo GIF of the application.
#
# Prerequisites:
#   macOS: brew install ffmpeg gifsicle
#   Linux: sudo apt install ffmpeg gifsicle
#
# Recording Tools (choose one):
#   - macOS: Use built-in screen recording (Cmd+Shift+5) or install `kap`
#   - Cross-platform: OBS Studio (free) - https://obsproject.com
#   - CLI: ffmpeg with x11grab (Linux) or avfoundation (macOS)
#
# =============================================================================

set -e

# Configuration
OUTPUT_DIR="docs"
VIDEO_FILE="$OUTPUT_DIR/pod-creation.mp4"
GIF_FILE="$OUTPUT_DIR/pod-creation-demo.gif"
GIF_WIDTH=800
GIF_FPS=12

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    local missing=0
    
    if command -v ffmpeg &> /dev/null; then
        print_success "ffmpeg found"
    else
        print_error "ffmpeg not found"
        missing=1
    fi
    
    if command -v gifsicle &> /dev/null; then
        print_success "gifsicle found"
    else
        print_warning "gifsicle not found (optional, for optimization)"
    fi
    
    if [ $missing -eq 1 ]; then
        echo -e "\n${YELLOW}Install missing dependencies:${NC}"
        echo "  macOS:  brew install ffmpeg gifsicle"
        echo "  Ubuntu: sudo apt install ffmpeg gifsicle"
        exit 1
    fi
}

# Convert video to GIF
convert_to_gif() {
    local input_file="$1"
    
    if [ ! -f "$input_file" ]; then
        print_error "Video file not found: $input_file"
        exit 1
    fi
    
    print_header "Converting Video to GIF"
    
    echo "Input: $input_file"
    echo "Output: $GIF_FILE"
    echo "Width: ${GIF_WIDTH}px, FPS: $GIF_FPS"
    echo ""
    
    # Generate palette for better quality
    local palette="/tmp/palette.png"
    
    echo "Generating color palette..."
    ffmpeg -y -i "$input_file" \
        -vf "fps=$GIF_FPS,scale=$GIF_WIDTH:-1:flags=lanczos,palettegen=stats_mode=diff" \
        "$palette" 2>/dev/null
    
    echo "Creating GIF..."
    ffmpeg -y -i "$input_file" -i "$palette" \
        -lavfi "fps=$GIF_FPS,scale=$GIF_WIDTH:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
        "$GIF_FILE" 2>/dev/null
    
    # Optimize with gifsicle if available
    if command -v gifsicle &> /dev/null; then
        echo "Optimizing GIF..."
        gifsicle -O3 --lossy=80 "$GIF_FILE" -o "$GIF_FILE"
    fi
    
    # Clean up
    rm -f "$palette"
    
    local size=$(du -h "$GIF_FILE" | cut -f1)
    print_success "GIF created: $GIF_FILE ($size)"
}

# Show recording instructions
show_instructions() {
    print_header "Demo Recording Instructions"
    
    cat << 'EOF'
RECOMMENDED DEMO FLOW (aim for 30-45 seconds):

1. START: Show the landing page / cluster architecture view (3s)

2. ARCHITECTURE FLOW: 
   - Click on "Architecture Flow" tab
   - Let the animation play showing component interactions (8-10s)

3. POD CREATION FLOW:
   - Click on "Pod Creation Flow" tab  
   - Watch the step-by-step pod creation animation (10-12s)
   - Highlight: API Server → etcd → Scheduler → Kubelet

4. INTERACTIVE LAB (optional):
   - Show creating a resource
   - Watch it appear in the visualization (5-8s)

5. END: Return to architecture view (2s)

RECORDING TIPS:
- Use a clean browser (no bookmarks bar, minimal extensions)
- Set browser zoom to 100%
- Window size: 1280x720 or 1920x1080
- Close notifications
- Use a solid color desktop background
- Move mouse smoothly and deliberately

TOOLS FOR RECORDING:

macOS:
  - Cmd+Shift+5 (built-in screen recording)
  - Kap (https://getkap.co) - exports directly to GIF
  - CleanShot X (paid, excellent quality)

Linux:
  - OBS Studio
  - Peek (simple GIF recorder)
  - SimpleScreenRecorder

Cross-platform:
  - OBS Studio (https://obsproject.com)
  - ScreenToGif (Windows)

EOF
}

# Main menu
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         K8s Simulation - Demo GIF Creator                 ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    mkdir -p "$OUTPUT_DIR"
    
    case "${1:-}" in
        convert)
            check_dependencies
            convert_to_gif "${2:-$VIDEO_FILE}"
            ;;
        instructions)
            show_instructions
            ;;
        *)
            echo "Usage: $0 <command>"
            echo ""
            echo "Commands:"
            echo "  instructions     Show recording tips and demo flow"
            echo "  convert [file]   Convert video to optimized GIF"
            echo ""
            echo "Examples:"
            echo "  $0 instructions"
            echo "  $0 convert                        # Uses docs/demo-recording.mp4"
            echo "  $0 convert ~/Desktop/my-demo.mov  # Custom video file"
            echo ""
            echo "Quick workflow:"
            echo "  1. Run: $0 instructions"
            echo "  2. Record your screen (save as docs/demo-recording.mp4)"
            echo "  3. Run: $0 convert"
            echo "  4. GIF will be saved to docs/demo.gif"
            ;;
    esac
}

main "$@"
