package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/nextlevelbuilder/goclaw/pkg/browser"
)

func main() {
	opts := []browser.Option{
		browser.WithHeadless(true),
		browser.WithMaxPages(20),
		browser.WithActionTimeout(60 * time.Second),
	}
	mgr := browser.New(opts...)
	
	ctx := context.Background()
	if err := mgr.Start(ctx); err != nil {
		slog.Error("failed to start manager", "error", err)
		os.Exit(1)
	}
	defer mgr.Close()
	
	urls := []string{
		"https://example.com",
		"https://en.wikipedia.org/wiki/Main_Page",
		"https://news.ycombinator.com",
		"https://github.com",
		"https://www.google.com",
		"https://developer.mozilla.org",
		"https://go.dev",
		"https://pkg.go.dev",
		"https://www.rust-lang.org",
		"https://www.w3.org",
	}
	
	var wg sync.WaitGroup
	errCh := make(chan error, len(urls))
	
	for i, u := range urls {
		wg.Add(1)
		go func(id int, url string) {
			defer wg.Done()
			
			// Context with timeout for each tab
			tabCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
			defer cancel()
			
			fmt.Printf("Worker %d starting: %s\n", id, url)
			
			tab, err := mgr.OpenTab(tabCtx, url)
			if err != nil {
				errCh <- fmt.Errorf("worker %d failed to open tab: %w", id, err)
				return
			}
			
			fmt.Printf("Worker %d opened tab %s with title: %s\n", id, tab.TargetID, tab.Title)
			
			// Snapshot to get more data and verify tab functionality
			snap, err := mgr.Snapshot(tabCtx, tab.TargetID, browser.SnapshotOptions{})
			if err != nil {
				errCh <- fmt.Errorf("worker %d failed snapshot: %w", id, err)
				return
			}
			
			fmt.Printf("Worker %d snapshot title: %s\n", id, snap.Title)
			
			// Wait a bit to simulate concurrent load
			time.Sleep(1 * time.Second)
			
			// Close tab
			if err := mgr.CloseTab(tabCtx, tab.TargetID); err != nil {
				errCh <- fmt.Errorf("worker %d failed to close tab: %w", id, err)
				return
			}
			
			fmt.Printf("Worker %d finished: %s\n", id, url)
		}(i, u)
	}
	
	wg.Wait()
	close(errCh)
	
	var hasErr bool
	for err := range errCh {
		fmt.Printf("Error: %v\n", err)
		hasErr = true
	}
	
	if hasErr {
		fmt.Println("Stress test FAILED")
		os.Exit(1)
	}
	
	fmt.Println("Stress test completed successfully!")
}
