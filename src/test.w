def write ( int ptr int -- )
  33554436
  syscall3
end

def sayu ( int -- )
  loop 20 0 for
    10 /mod 48 + 20 i - mem + !
    dup 1 < if
      i 1 +
      mem 20 i - +
      1
      write
      leave
    end
  end
  drop
end

def nl ( -- )
  10 mem !
  1
  mem
  1
  write
end

10 20 swap
sayu nl
sayu nl

