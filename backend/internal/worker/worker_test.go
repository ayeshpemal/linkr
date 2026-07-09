package worker

import (
	"context"
	"sync"
	"testing"

	"github.com/google/uuid"
)

type stubClickRecorder struct {
	mu    sync.Mutex
	calls int
}

func (s *stubClickRecorder) RecordClick(_ context.Context, _ uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.calls++
	return nil
}

func (s *stubClickRecorder) CallCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.calls
}


// Tests that StartClickProcessor drains the click channel and calls RecordClick for each click.
func TestStartClickProcessorDrainsChannelAndRecordsEachClick(t *testing.T) {
	recorder := &stubClickRecorder{}
	clickChan := make(chan uuid.UUID, 10)
	done := make(chan struct{})

	go func() {
		defer close(done)
		StartClickProcessor(recorder, clickChan)
	}()

	for range 5 {
		clickChan <- uuid.New()
	}
	close(clickChan)

	<-done

	if got := recorder.CallCount(); got != 5 {
		t.Fatalf("RecordClick call count = %d, want 5", got)
	}
}
